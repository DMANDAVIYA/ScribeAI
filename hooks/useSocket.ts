"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { TranscriptChunk, SessionStatus } from "@/types";

/**
 * Custom hook for Socket.io client connection and event handling
 */
export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]);
    const [status, setStatus] = useState<SessionStatus>("IDLE");
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Initialize Socket.io connection
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        const socket = io(socketUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Connection event handlers
        socket.on("connect", () => {
            console.log("Socket connected");
            setIsConnected(true);
            setError(null);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            setIsConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error("Connection error:", err);
            setError("Failed to connect to server");
        });

        // Session event handlers
        socket.on("session-created", (data: { sessionId: string }) => {
            console.log("Session created:", data.sessionId);
            setSessionId(data.sessionId);
            setStatus("RECORDING");
        });

        socket.on("transcription-update", (data: { sessionId: string; chunk: TranscriptChunk }) => {
            console.log("Transcription update:", data.chunk);
            setTranscriptChunks((prev) => [...prev, data.chunk]);
        });

        socket.on("status-update", (data: { sessionId: string; status: SessionStatus }) => {
            console.log("Status update:", data.status);
            setStatus(data.status);
        });

        socket.on("processing-complete", (data: { sessionId: string; downloadUrl: string }) => {
            console.log("Processing complete:", data.downloadUrl);
            setStatus("COMPLETED");
        });

        socket.on("error", (data: { message: string; code?: string }) => {
            console.error("Socket error:", data.message);
            setError(data.message);
            setStatus("ERROR");
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, []);

    /**
     * Start recording session
     */
    const startRecording = (userId: string, audioSource: "microphone" | "tab") => {
        if (!socketRef.current) return;

        setTranscriptChunks([]);
        setError(null);
        socketRef.current.emit("start-recording", { userId, audioSource });
    };

    /**
     * Send audio chunk
     */
    const sendAudioChunk = (chunk: ArrayBuffer, timestamp: number) => {
        if (!socketRef.current || !sessionId) return;

        socketRef.current.emit("audio-chunk", { sessionId, chunk, timestamp });
    };

    /**
     * Pause recording
     */
    const pauseRecording = () => {
        if (!socketRef.current || !sessionId) return;

        socketRef.current.emit("pause-recording", { sessionId });
    };

    /**
     * Resume recording
     */
    const resumeRecording = () => {
        if (!socketRef.current || !sessionId) return;

        socketRef.current.emit("resume-recording", { sessionId });
    };

    /**
     * Stop recording
     */
    const stopRecording = (clientTranscript?: string, duration?: number) => {
        if (!socketRef.current || !sessionId) return;

        socketRef.current.emit("stop-recording", { sessionId, clientTranscript, duration });
    };

    return {
        isConnected,
        sessionId,
        transcriptChunks,
        status,
        error,
        startRecording,
        sendAudioChunk,
        pauseRecording,
        resumeRecording,
        stopRecording,
    };
}
