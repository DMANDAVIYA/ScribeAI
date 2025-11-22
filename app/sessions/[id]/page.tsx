"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Session } from "@/types";

export default function SessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/sessions/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                setSession(data.data);
            } else {
                setError(data.error || "Failed to fetch session");
            }
        } catch (err) {
            setError("Failed to fetch session");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const downloadTranscript = (format: "txt" | "json") => {
        window.open(`/api/sessions/${sessionId}/download?format=${format}`, "_blank");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-4 py-8">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-900 dark:text-red-100">{error || "Session not found"}</p>
                    </div>
                    <Link href="/sessions" className="mt-4 inline-block">
                        <Button variant="secondary">Back to Sessions</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/sessions" className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Sessions
                    </Link>

                    <div className="flex items-start justify-between mt-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                {session.title || `Session ${session.id.slice(0, 8)}`}
                            </h1>
                            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                                <span>{new Date(session.createdAt).toLocaleString()}</span>
                                <span>•</span>
                                <span>
                                    {Math.floor(session.duration / 60)}m {session.duration % 60}s
                                </span>
                                {session.audioSource && (
                                    <>
                                        <span>•</span>
                                        <span className="capitalize">{session.audioSource}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <Button variant="secondary" onClick={() => downloadTranscript("txt")}>
                                Download TXT
                            </Button>
                            <Button variant="secondary" onClick={() => downloadTranscript("json")}>
                                Download JSON
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {session.summary && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>AI Summary</CardTitle>
                            <CardDescription>Automatically generated meeting summary</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="text-gray-700 dark:text-gray-300">{session.summary.content}</p>
                            </div>

                            {session.summary.keyPoints && Array.isArray(session.summary.keyPoints) && session.summary.keyPoints.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                        Key Points
                                    </h3>
                                    <ul className="space-y-2">
                                        {(session.summary.keyPoints as string[]).map((point, index) => (
                                            <li key={index} className="flex items-start space-x-2">
                                                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                                                <span className="text-gray-700 dark:text-gray-300">{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {session.summary.actionItems && Array.isArray(session.summary.actionItems) && session.summary.actionItems.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                        Action Items
                                    </h3>
                                    <ul className="space-y-2">
                                        {(session.summary.actionItems as string[]).map((item, index) => (
                                            <li key={index} className="flex items-start space-x-2">
                                                <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                                                <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {session.summary.decisions && Array.isArray(session.summary.decisions) && session.summary.decisions.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                        Decisions
                                    </h3>
                                    <ul className="space-y-2">
                                        {(session.summary.decisions as string[]).map((decision, index) => (
                                            <li key={index} className="flex items-start space-x-2">
                                                <span className="text-purple-600 dark:text-purple-400 mt-1">→</span>
                                                <span className="text-gray-700 dark:text-gray-300">{decision}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Transcript */}
                {session.transcript && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Full Transcript</CardTitle>
                            <CardDescription>Complete recording transcription</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                                    {session.transcript.content}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!session.transcript && !session.summary && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <p>No transcript or summary available for this session.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
