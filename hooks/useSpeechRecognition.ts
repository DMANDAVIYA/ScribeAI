"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TranscriptChunk } from "@/types";

/**
 * Custom hook for Web Speech API (browser-based speech recognition)
 * FREE, real-time transcription without API keys
 */
export function useSpeechRecognition() {
    const [isSupported, setIsSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([]);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);

    // Check browser support
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            setIsSupported(!!SpeechRecognition);

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";
                recognition.maxAlternatives = 1;

                recognitionRef.current = recognition;
            }
        }
    }, []);

    /**
     * Start speech recognition
     */
    const startRecognition = useCallback(() => {
        if (!recognitionRef.current) {
            setError("Speech recognition not supported in this browser");
            return;
        }

        try {
            setError(null);
            setTranscriptChunks([]);
            startTimeRef.current = Date.now();

            const recognition = recognitionRef.current;

            recognition.onresult = (event: any) => {
                const results = event.results;
                const lastResult = results[results.length - 1];

                if (lastResult.isFinal) {
                    const transcript = lastResult[0].transcript;
                    const timestamp = Date.now() - startTimeRef.current;

                    const chunk: TranscriptChunk = {
                        timestamp,
                        text: transcript.trim(),
                        speaker: undefined, // Web Speech API doesn't support speaker diarization
                    };

                    setTranscriptChunks((prev) => [...prev, chunk]);
                    console.log(`✅ Transcribed: "${transcript}"`);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === "no-speech") {
                    // Ignore no-speech errors (user not speaking)
                    return;
                }
                setError(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };

            recognition.onend = () => {
                // Auto-restart if still supposed to be listening
                if (isListening) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Failed to restart recognition:", e);
                    }
                }
            };

            recognition.start();
            setIsListening(true);
            console.log("🎤 Web Speech API started");
        } catch (err: any) {
            console.error("Error starting recognition:", err);
            setError(err.message || "Failed to start speech recognition");
            setIsListening(false);
        }
    }, [isListening]);

    /**
     * Stop speech recognition
     */
    const stopRecognition = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                setIsListening(false);
                console.log("🛑 Web Speech API stopped");
            } catch (err) {
                console.error("Error stopping recognition:", err);
            }
        }
    }, []);

    /**
     * Clear transcript chunks
     */
    const clearTranscripts = useCallback(() => {
        setTranscriptChunks([]);
    }, []);

    return {
        isSupported,
        isListening,
        transcriptChunks,
        error,
        startRecognition,
        stopRecognition,
        clearTranscripts,
    };
}
