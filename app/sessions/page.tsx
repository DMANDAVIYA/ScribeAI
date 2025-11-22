"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import type { Session } from "@/types";

export default function SessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // For now, using a hardcoded user ID. In production, get from auth session
    const userId = "demo-user-id";

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/sessions?userId=${userId}`);
            const data = await response.json();

            if (data.success) {
                setSessions(data.data.items);
            } else {
                setError(data.error || "Failed to fetch sessions");
            }
        } catch (err) {
            setError("Failed to fetch sessions");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to delete this session?")) return;

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setSessions(sessions.filter((s) => s.id !== sessionId));
            } else {
                alert("Failed to delete session");
            }
        } catch (err) {
            alert("Failed to delete session");
            console.error(err);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors = {
            IDLE: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
            RECORDING: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            PAUSED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
            COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            ERROR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.IDLE}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                Session History
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                View and manage your recording sessions
                            </p>
                        </div>

                        <Link href="/dashboard">
                            <Button variant="primary">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Recording
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Spinner size="lg" />
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-900 dark:text-red-100">{error}</p>
                    </div>
                )}

                {/* Sessions List */}
                {!loading && !error && sessions.length === 0 && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
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
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                    No sessions yet
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Get started by creating a new recording
                                </p>
                                <div className="mt-6">
                                    <Link href="/dashboard">
                                        <Button variant="primary">Start Recording</Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!loading && !error && sessions.length > 0 && (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <Card key={session.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <CardTitle className="text-xl">
                                                    {session.title || `Session ${session.id.slice(0, 8)}`}
                                                </CardTitle>
                                                {getStatusBadge(session.status)}
                                            </div>
                                            <CardDescription>
                                                <span className="flex items-center space-x-4 text-sm">
                                                    <span>{formatRelativeTime(new Date(session.createdAt))}</span>
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
                                                </span>
                                            </CardDescription>
                                        </div>

                                        <div className="flex space-x-2">
                                            <Link href={`/sessions/${session.id}`}>
                                                <Button variant="secondary" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => deleteSession(session.id)}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {session.transcript && (
                                    <CardContent>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                            {session.transcript.content.slice(0, 200)}...
                                        </p>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
