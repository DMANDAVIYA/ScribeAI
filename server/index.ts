import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { transcribeAudioChunk, generateMeetingSummary } from "../lib/gemini";
import { AudioProcessor } from "./audio-processor";
import { prisma } from "../lib/prisma";
import type { TranscriptChunk } from "../types";

/**
 * WebSocket server for real-time audio streaming and transcription
 */

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 1e7, // 10MB
});

// Store audio processors for each session
const sessionProcessors = new Map<string, AudioProcessor>();
const sessionTranscripts = new Map<string, TranscriptChunk[]>();

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    /**
     * Start recording session
     */
    socket.on("start-recording", async (data: { userId: string; audioSource: string }) => {
        try {
            const { userId, audioSource } = data;

            // Create new session in database
            const session = await prisma.session.create({
                data: {
                    userId,
                    audioSource,
                    status: "RECORDING",
                    title: `Recording ${new Date().toLocaleString()}`,
                },
            });

            // Initialize audio processor for this session
            sessionProcessors.set(session.id, new AudioProcessor());
            sessionTranscripts.set(session.id, []);

            // Join room for this session
            socket.join(session.id);

            // Emit session created event
            socket.emit("session-created", { sessionId: session.id });
            console.log(`Session created: ${session.id}`);
        } catch (error) {
            console.error("Error starting recording:", error);
            socket.emit("error", { message: "Failed to start recording" });
        }
    });

    /**
     * Receive audio chunk
     */
    socket.on(
        "audio-chunk",
        async (data: { sessionId: string; chunk: ArrayBuffer; timestamp: number }) => {
            try {
                const { sessionId, chunk, timestamp } = data;

                const processor = sessionProcessors.get(sessionId);
                if (!processor) {
                    socket.emit("error", { message: "Session not found" });
                    return;
                }

                // Add chunk to processor
                processor.addChunk(chunk);

                // Transcribe chunk using Gemini
                try {
                    const transcriptChunk = await transcribeAudioChunk(chunk, timestamp);

                    // Store transcript chunk
                    const chunks = sessionTranscripts.get(sessionId) || [];
                    chunks.push(transcriptChunk);
                    sessionTranscripts.set(sessionId, chunks);

                    // Emit transcription update to client
                    io.to(sessionId).emit("transcription-update", { sessionId, chunk: transcriptChunk });

                    // Update session duration
                    await prisma.session.update({
                        where: { id: sessionId },
                        data: { duration: Math.floor(timestamp / 1000) },
                    });
                } catch (error) {
                    console.error("Error transcribing chunk:", error);
                    // Continue processing even if transcription fails
                }
            } catch (error) {
                console.error("Error processing audio chunk:", error);
                socket.emit("error", { message: "Failed to process audio chunk" });
            }
        }
    );

    /**
     * Pause recording
     */
    socket.on("pause-recording", async (data: { sessionId: string }) => {
        try {
            const { sessionId } = data;

            await prisma.session.update({
                where: { id: sessionId },
                data: { status: "PAUSED" },
            });

            io.to(sessionId).emit("status-update", { sessionId, status: "PAUSED" });
            console.log(`Session paused: ${sessionId}`);
        } catch (error) {
            console.error("Error pausing recording:", error);
            socket.emit("error", { message: "Failed to pause recording" });
        }
    });

    /**
     * Resume recording
     */
    socket.on("resume-recording", async (data: { sessionId: string }) => {
        try {
            const { sessionId } = data;

            await prisma.session.update({
                where: { id: sessionId },
                data: { status: "RECORDING" },
            });

            io.to(sessionId).emit("status-update", { sessionId, status: "RECORDING" });
            console.log(`Session resumed: ${sessionId}`);
        } catch (error) {
            console.error("Error resuming recording:", error);
            socket.emit("error", { message: "Failed to resume recording" });
        }
    });

    /**
     * Stop recording and process summary
     */
    socket.on("stop-recording", async (data: { sessionId: string; clientTranscript?: string; duration?: number }) => {
        try {
            const { sessionId, clientTranscript, duration } = data;

            // Update status to processing
            await prisma.session.update({
                where: { id: sessionId },
                data: { status: "PROCESSING" },
            });

            io.to(sessionId).emit("status-update", { sessionId, status: "PROCESSING" });

            // Get all transcript chunks
            const chunks = sessionTranscripts.get(sessionId) || [];
            let fullTranscript = chunks.map((c) => `${c.speaker ? c.speaker + ": " : ""}${c.text}`).join("\n");

            // Use client transcript if available (fallback for Web Speech API)
            if (clientTranscript && (!fullTranscript || fullTranscript.includes("Mock transcription"))) {
                console.log("Using client-side transcript for saving");
                fullTranscript = clientTranscript;
            }

            // Save transcript to database
            await prisma.transcript.create({
                data: {
                    sessionId,
                    content: fullTranscript || "No transcript available",
                    chunks: chunks as any,
                },
            });

            // Generate summary using Gemini
            let summary;
            try {
                summary = await generateMeetingSummary(fullTranscript);

                // Save summary to database
                await prisma.summary.create({
                    data: {
                        sessionId,
                        content: summary.content,
                        keyPoints: summary.keyPoints as any,
                        actionItems: summary.actionItems as any,
                        decisions: summary.decisions as any,
                    },
                });
            } catch (error) {
                console.error("Error generating summary:", error);
            }

            // Update session status to completed and set duration if provided
            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    status: "COMPLETED",
                    ...(duration ? { duration } : {})
                },
            });

            // Clean up
            sessionProcessors.delete(sessionId);
            sessionTranscripts.delete(sessionId);

            // Emit completion event
            const downloadUrl = `/api/sessions/${sessionId}/download`;
            io.to(sessionId).emit("processing-complete", { sessionId, downloadUrl });
            io.to(sessionId).emit("status-update", { sessionId, status: "COMPLETED" });

            console.log(`Session completed: ${sessionId}`);
        } catch (error) {
            console.error("Error stopping recording:", error);
            socket.emit("error", { message: "Failed to stop recording" });

            // Update session status to error
            try {
                await prisma.session.update({
                    where: { id: data.sessionId },
                    data: { status: "ERROR" },
                });
            } catch (dbError) {
                console.error("Error updating session status:", dbError);
            }
        }
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});

export { io };
