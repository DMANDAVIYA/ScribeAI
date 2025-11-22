"use client";

import { useState, useEffect } from "react";
import { useRecording } from "@/hooks/useRecording";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Button } from "./ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/Card";
import { Spinner } from "./ui/Spinner";
import { TranscriptDisplay } from "./TranscriptDisplay";
import type { AudioSource } from "@/types";

interface RecordingInterfaceProps {
    userId: string;
}

export function RecordingInterface({ userId }: RecordingInterfaceProps) {
    const [selectedSource, setSelectedSource] = useState<AudioSource>("microphone");
    const recording = useRecording(userId);
    const speechRecognition = useSpeechRecognition();

    // Sync speech recognition with recording state
    useEffect(() => {
        if (recording.isRecording && !recording.isPaused) {
            if (!speechRecognition.isListening) {
                speechRecognition.startRecognition();
            }
        } else {
            if (speechRecognition.isListening) {
                speechRecognition.stopRecognition();
            }
        }
    }, [recording.isRecording, recording.isPaused]);

    const handleStart = async () => {
        try {
            await recording.startRecording(selectedSource);
        } catch (error) {
            console.error("Failed to start recording:", error);
            alert("Failed to start recording. Please check your permissions.");
        }
    };

    const getStatusColor = () => {
        switch (recording.status) {
            case "RECORDING":
                return "text-red-600";
            case "PAUSED":
                return "text-yellow-600";
            case "PROCESSING":
                return "text-blue-600";
            case "COMPLETED":
                return "text-green-600";
            case "ERROR":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const getStatusText = () => {
        if (recording.isPaused) return "PAUSED";
        return recording.status;
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Audio Recording</CardTitle>
                <CardDescription>
                    Record audio from your microphone or browser tab for real-time transcription
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                    <div
                        className={`h-3 w-3 rounded-full ${recording.isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {recording.isConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>

                {/* Audio Source Selection */}
                {!recording.isRecording && (
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Audio Source
                        </label>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setSelectedSource("microphone")}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${selectedSource === "microphone"
                                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex flex-col items-center space-y-2">
                                    <svg
                                        className="w-8 h-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                        />
                                    </svg>
                                    <span className="font-medium">Microphone</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setSelectedSource("tab")}
                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${selectedSource === "tab"
                                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <div className="flex flex-col items-center space-y-2">
                                    <svg
                                        className="w-8 h-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <span className="font-medium">Browser Tab</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Recording Controls */}
                {recording.isRecording && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className={`h-3 w-3 rounded-full ${recording.isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`} />
                                    <span className={`font-semibold ${getStatusColor()}`}>
                                        {getStatusText()}
                                    </span>
                                </div>
                                <span className="text-2xl font-mono font-bold">
                                    {recording.formattedDuration}
                                </span>
                            </div>

                            <div className="flex space-x-2">
                                {!recording.isPaused ? (
                                    <Button onClick={recording.pauseRecording} variant="secondary" size="sm">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                        </svg>
                                        Pause
                                    </Button>
                                ) : (
                                    <Button onClick={recording.resumeRecording} variant="primary" size="sm">
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        Resume
                                    </Button>
                                )}

                                <Button
                                    onClick={() => {
                                        // Get full transcript from Web Speech API if available
                                        const fullTranscript = speechRecognition.transcriptChunks
                                            .map(c => c.text)
                                            .join("\n");

                                        recording.stopRecording(fullTranscript || undefined);
                                    }}
                                    variant="danger"
                                    size="sm"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 6h12v12H6z" />
                                    </svg>
                                    Stop
                                </Button>
                            </div>
                        </div>

                        {/* Transcript Display */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold">Live Transcription</h3>
                                {speechRecognition.isSupported && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full flex items-center">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></span>
                                        Browser Speech API
                                    </span>
                                )}
                            </div>
                            <TranscriptDisplay
                                chunks={speechRecognition.isSupported && speechRecognition.transcriptChunks.length > 0
                                    ? speechRecognition.transcriptChunks
                                    : recording.transcriptChunks}
                            />
                        </div>
                    </div>
                )}

                {/* Start Button */}
                {!recording.isRecording && recording.status !== "PROCESSING" && (
                    <Button
                        onClick={handleStart}
                        disabled={!recording.isConnected}
                        className="w-full"
                        size="lg"
                    >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                        Start Recording
                    </Button>
                )}

                {/* Processing State */}
                {recording.status === "PROCESSING" && (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <Spinner size="lg" />
                        <p className="text-lg font-medium">Processing recording...</p>
                        <p className="text-sm text-gray-500">Saving session data...</p>
                    </div>
                )}

                {/* Completed State */}
                {recording.status === "COMPLETED" && recording.sessionId && (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-lg font-medium text-green-900 dark:text-green-100">
                            Recording completed successfully!
                        </p>
                        <Button
                            onClick={() => window.location.href = `/sessions/${recording.sessionId}`}
                            variant="primary"
                        >
                            View Session
                        </Button>
                    </div>
                )}

                {/* Error Display */}
                {(recording.error || speechRecognition.error) && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-900 dark:text-red-100">
                            {recording.error || speechRecognition.error}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
