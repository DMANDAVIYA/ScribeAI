"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSocket } from "./useSocket";
import type { AudioSource } from "@/types";

/**
 * Custom hook for managing audio recording with MediaRecorder API
 */
export function useRecording(userId: string) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioSource, setAudioSource] = useState<AudioSource>("microphone");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const startTimeRef = useRef<number>(0);
    const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const socket = useSocket();

    /**
     * Start recording from microphone or tab
     */
    const startRecording = useCallback(
        async (source: AudioSource) => {
            try {
                setAudioSource(source);
                let stream: MediaStream;

                if (source === "microphone") {
                    // Get microphone audio
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            sampleRate: 48000,
                        },
                    });
                } else {
                    // Get tab/screen audio - must include video to capture audio
                    const displayStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true, // Required to capture audio
                        audio: true,
                    });

                    // Extract only audio tracks
                    const audioTracks = displayStream.getAudioTracks();
                    if (audioTracks.length === 0) {
                        throw new Error("No audio track found in the selected tab/screen");
                    }

                    // Stop video tracks since we only need audio
                    displayStream.getVideoTracks().forEach((track) => track.stop());

                    // Create new stream with only audio
                    stream = new MediaStream(audioTracks);
                }

                streamRef.current = stream;

                // Determine supported mimeType
                let mimeType = "audio/webm";
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = "audio/mp4";
                }
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = ""; // Use default
                }

                // Create MediaRecorder
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: mimeType || undefined,
                });

                mediaRecorderRef.current = mediaRecorder;

                // Handle audio data
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        // Convert Blob to ArrayBuffer and send via socket
                        event.data.arrayBuffer().then((buffer) => {
                            const timestamp = Date.now() - startTimeRef.current;
                            socket.sendAudioChunk(buffer, timestamp);
                        });
                    }
                };

                mediaRecorder.onerror = (event) => {
                    console.error("MediaRecorder error:", event);
                    stopRecording();
                };

                // Start recording with 1-second chunks
                mediaRecorder.start(1000);
                startTimeRef.current = Date.now();
                setIsRecording(true);
                setIsPaused(false);
                setDuration(0);

                // Start duration counter
                durationIntervalRef.current = setInterval(() => {
                    setDuration((prev) => prev + 1);
                }, 1000);

                // Notify socket to start session
                socket.startRecording(userId, source);
            } catch (error) {
                console.error("Error starting recording:", error);
                throw error;
            }
        },
        [userId, socket]
    );

    /**
     * Pause recording
     */
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause();
            setIsPaused(true);

            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }

            socket.pauseRecording();
        }
    }, [socket]);

    /**
     * Resume recording
     */
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            // Resume duration counter
            durationIntervalRef.current = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);

            socket.resumeRecording();
        }
    }, [socket]);

    /**
     * Stop recording
     */
    const stopRecording = useCallback((clientTranscript?: string) => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);

            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }

            socket.stopRecording(clientTranscript, duration);
        }

        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, [socket]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    /**
     * Format duration as MM:SS
     */
    const formattedDuration = `${Math.floor(duration / 60)
        .toString()
        .padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`;

    return {
        isRecording,
        isPaused,
        duration,
        formattedDuration,
        audioSource,
        transcriptChunks: socket.transcriptChunks,
        status: socket.status,
        error: socket.error,
        isConnected: socket.isConnected,
        sessionId: socket.sessionId,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
    };
}
