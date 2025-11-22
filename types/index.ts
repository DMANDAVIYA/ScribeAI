/**
 * Type definitions for the ScribeAI application
 */

export type SessionStatus = "IDLE" | "RECORDING" | "PAUSED" | "PROCESSING" | "COMPLETED" | "ERROR";

export type AudioSource = "microphone" | "tab";

export interface TranscriptChunk {
    timestamp: number;
    text: string;
    speaker?: string;
}

export interface Summary {
    content: string;
    keyPoints: string[];
    actionItems: string[];
    decisions: string[];
}

export interface Session {
    id: string;
    userId: string;
    title?: string;
    duration: number;
    status: SessionStatus;
    audioSource?: AudioSource;
    createdAt: Date;
    updatedAt: Date;
    transcript?: {
        content: string;
        chunks?: TranscriptChunk[];
    };
    summary?: Summary;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Socket.io event types
export interface SocketEvents {
    // Client to Server
    "start-recording": (data: { userId: string; audioSource: AudioSource }) => void;
    "audio-chunk": (data: { sessionId: string; chunk: ArrayBuffer; timestamp: number }) => void;
    "pause-recording": (data: { sessionId: string }) => void;
    "resume-recording": (data: { sessionId: string }) => void;
    "stop-recording": (data: { sessionId: string }) => void;

    // Server to Client
    "session-created": (data: { sessionId: string }) => void;
    "transcription-update": (data: { sessionId: string; chunk: TranscriptChunk }) => void;
    "status-update": (data: { sessionId: string; status: SessionStatus }) => void;
    "processing-complete": (data: { sessionId: string; downloadUrl: string }) => void;
    error: (data: { message: string; code?: string }) => void;
}

// Recording state machine states
export type RecordingState =
    | { value: "idle"; context: RecordingContext }
    | { value: "recording"; context: RecordingContext }
    | { value: "paused"; context: RecordingContext }
    | { value: "processing"; context: RecordingContext }
    | { value: "completed"; context: RecordingContext }
    | { value: "error"; context: RecordingContext };

export interface RecordingContext {
    sessionId?: string;
    audioSource?: AudioSource;
    startTime?: number;
    duration: number;
    error?: string;
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
