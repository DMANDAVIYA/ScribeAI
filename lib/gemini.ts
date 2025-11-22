import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TranscriptChunk } from "@/types";

/**
 * Google Gemini API integration for audio transcription and summarization
 */

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Transcribe audio chunk using Gemini API
 * NOTE: Gemini API has limited audio support. This is a mock implementation.
 * For production, use a dedicated speech-to-text service like Google Cloud Speech-to-Text,
 * OpenAI Whisper API, or AssemblyAI.
 * 
 * @param audioChunk - Audio data as ArrayBuffer
 * @param timestamp - Timestamp of the chunk
 * @returns Transcribed text with speaker differentiation
 */
export async function transcribeAudioChunk(
    audioChunk: ArrayBuffer,
    timestamp: number
): Promise<TranscriptChunk> {
    try {
        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.warn("⚠️  GEMINI_API_KEY not configured - using mock transcription");
            return {
                timestamp,
                text: `[Mock transcription at ${Math.floor(timestamp / 1000)}s - Add GEMINI_API_KEY to .env for real transcription]`,
                speaker: undefined,
            };
        }

        console.log(`🎤 Attempting to transcribe audio chunk (${audioChunk.byteLength} bytes) at ${timestamp}ms`);

        // NOTE: Gemini API audio support is experimental and may not work reliably
        // This is kept for demonstration purposes
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Convert ArrayBuffer to base64
        const base64Audio = Buffer.from(audioChunk).toString("base64");

        const prompt = `Transcribe the following audio chunk. If multiple speakers are detected, differentiate them as Speaker 1, Speaker 2, etc. Provide only the transcription text without any additional formatting or explanations.`;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: "audio/webm",
                    data: base64Audio,
                },
            },
            { text: prompt },
        ]);

        const response = await result.response;
        const text = response.text();

        console.log(`✅ Transcription successful: "${text.substring(0, 50)}..."`);

        return {
            timestamp,
            text: text.trim(),
            speaker: extractSpeaker(text),
        };
    } catch (error: any) {
        console.error("❌ Error transcribing audio chunk:", error.message || error);

        // Return mock transcription on error instead of throwing
        return {
            timestamp,
            text: `[Transcription error: ${error.message || "Unknown error"} - Gemini API may not support audio transcription. Consider using Google Cloud Speech-to-Text or OpenAI Whisper API]`,
            speaker: undefined,
        };
    }
}

/**
 * Generate meeting summary from full transcript
 * @param transcript - Complete meeting transcript
 * @returns Structured summary with key points, action items, and decisions
 */
export async function generateMeetingSummary(transcript: string): Promise<{
    content: string;
    keyPoints: string[];
    actionItems: string[];
    decisions: string[];
}> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn("⚠️  GEMINI_API_KEY not configured - using mock summary");
            return {
                content: "Mock summary - Add GEMINI_API_KEY to .env for real AI summaries",
                keyPoints: ["Mock key point 1", "Mock key point 2"],
                actionItems: ["Mock action item 1"],
                decisions: ["Mock decision 1"],
            };
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `Analyze the following meeting transcript and provide a comprehensive summary in the following JSON format:

{
  "content": "A brief 2-3 sentence overview of the meeting",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "actionItems": ["Action item 1", "Action item 2", ...],
  "decisions": ["Decision 1", "Decision 2", ..."]
}

Meeting Transcript:
${transcript}

Provide ONLY the JSON response, no additional text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse summary response");
        }

        const summary = JSON.parse(jsonMatch[0]);

        return {
            content: summary.content || "No summary available",
            keyPoints: Array.isArray(summary.keyPoints) ? summary.keyPoints : [],
            actionItems: Array.isArray(summary.actionItems) ? summary.actionItems : [],
            decisions: Array.isArray(summary.decisions) ? summary.decisions : [],
        };
    } catch (error) {
        console.error("Error generating summary:", error);
        throw new Error("Failed to generate meeting summary");
    }
}

/**
 * Extract speaker information from transcribed text
 * @param text - Transcribed text
 * @returns Speaker identifier or undefined
 */
function extractSpeaker(text: string): string | undefined {
    const speakerMatch = text.match(/^(Speaker \d+):/);
    return speakerMatch ? speakerMatch[1] : undefined;
}

/**
 * Optimize prompt for multi-speaker differentiation
 * @param context - Previous transcript chunks for context
 * @returns Optimized prompt
 */
export function getOptimizedPrompt(context?: string): string {
    if (context) {
        return `Continue transcribing the audio. Previous context: "${context.slice(-200)}". Maintain speaker consistency and differentiate speakers as Speaker 1, Speaker 2, etc. Provide only the transcription text.`;
    }
    return `Transcribe the audio. If multiple speakers are detected, differentiate them as Speaker 1, Speaker 2, etc. Provide only the transcription text.`;
}
