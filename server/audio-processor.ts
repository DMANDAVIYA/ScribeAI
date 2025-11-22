/**
 * Audio processing utilities for chunking and buffer management
 */

export class AudioProcessor {
    private chunks: ArrayBuffer[] = [];
    private readonly chunkDuration = 30000; // 30 seconds in milliseconds
    private readonly maxBufferSize = 10 * 1024 * 1024; // 10MB max buffer
    private currentBufferSize = 0;

    /**
     * Add audio chunk to buffer
     * @param chunk - Audio data as ArrayBuffer
     * @returns True if chunk was added, false if buffer is full
     */
    addChunk(chunk: ArrayBuffer): boolean {
        const chunkSize = chunk.byteLength;

        // Check for buffer overflow
        if (this.currentBufferSize + chunkSize > this.maxBufferSize) {
            console.warn("Buffer overflow prevented, clearing oldest chunks");
            this.clearOldestChunks();
        }

        this.chunks.push(chunk);
        this.currentBufferSize += chunkSize;
        return true;
    }

    /**
     * Get all chunks and clear buffer
     * @returns Array of audio chunks
     */
    getAndClearChunks(): ArrayBuffer[] {
        const chunks = [...this.chunks];
        this.clear();
        return chunks;
    }

    /**
     * Clear all chunks from buffer
     */
    clear(): void {
        this.chunks = [];
        this.currentBufferSize = 0;
    }

    /**
     * Clear oldest chunks to free up buffer space
     */
    private clearOldestChunks(): void {
        const halfSize = Math.floor(this.chunks.length / 2);
        const removedChunks = this.chunks.splice(0, halfSize);

        const removedSize = removedChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        this.currentBufferSize -= removedSize;
    }

    /**
     * Get current buffer size in bytes
     */
    getBufferSize(): number {
        return this.currentBufferSize;
    }

    /**
     * Get number of chunks in buffer
     */
    getChunkCount(): number {
        return this.chunks.length;
    }

    /**
     * Merge multiple audio chunks into a single ArrayBuffer
     * @param chunks - Array of audio chunks
     * @returns Merged audio data
     */
    static mergeChunks(chunks: ArrayBuffer[]): ArrayBuffer {
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const merged = new Uint8Array(totalLength);

        let offset = 0;
        for (const chunk of chunks) {
            merged.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        }

        return merged.buffer;
    }

    /**
     * Convert audio format if needed
     * @param audioData - Audio data as ArrayBuffer
     * @param targetFormat - Target audio format
     * @returns Converted audio data
     */
    static async convertFormat(
        audioData: ArrayBuffer,
        targetFormat: string = "audio/webm"
    ): Promise<ArrayBuffer> {
        // For now, return as-is. In production, implement actual conversion
        // using libraries like ffmpeg.wasm if needed
        return audioData;
    }
}

/**
 * Calculate audio duration from ArrayBuffer
 * @param audioData - Audio data
 * @param sampleRate - Sample rate (default 48000 Hz)
 * @returns Duration in seconds
 */
export function calculateAudioDuration(
    audioData: ArrayBuffer,
    sampleRate: number = 48000
): number {
    const samples = audioData.byteLength / 2; // 16-bit audio
    return samples / sampleRate;
}

/**
 * Validate audio chunk
 * @param chunk - Audio chunk to validate
 * @returns True if valid, false otherwise
 */
export function isValidAudioChunk(chunk: any): chunk is ArrayBuffer {
    return chunk instanceof ArrayBuffer && chunk.byteLength > 0;
}
