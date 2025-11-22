"use client";

import type { TranscriptChunk } from "@/types";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TranscriptDisplayProps {
    chunks: TranscriptChunk[];
    className?: string;
}

export function TranscriptDisplay({ chunks, className }: TranscriptDisplayProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new chunks arrive
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [chunks]);

    if (chunks.length === 0) {
        return (
            <div className={cn("flex items-center justify-center p-8 text-gray-500", className)}>
                <p>Transcription will appear here...</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "max-h-96 overflow-y-auto space-y-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50",
                className
            )}
        >
            {chunks.map((chunk, index) => (
                <div key={index} className="flex flex-col space-y-1">
                    <div className="flex items-baseline space-x-2">
                        {chunk.speaker && (
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {chunk.speaker}
                            </span>
                        )}
                        <span className="text-xs text-gray-400">
                            {new Date(chunk.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <p className="text-gray-900 dark:text-gray-100">{chunk.text}</p>
                </div>
            ))}
        </div>
    );
}
