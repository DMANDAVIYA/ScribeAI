import { z } from "zod";

/**
 * Zod validators for API requests and data validation
 */

export const sessionCreateSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    audioSource: z.enum(["microphone", "tab"]),
    title: z.string().optional(),
});

export const audioChunkSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    chunk: z.instanceof(ArrayBuffer),
    timestamp: z.number().positive(),
});

export const sessionUpdateSchema = z.object({
    title: z.string().optional(),
    status: z.enum(["IDLE", "RECORDING", "PAUSED", "PROCESSING", "COMPLETED", "ERROR"]).optional(),
});

export const paginationSchema = z.object({
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(20),
});

export const userRegisterSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().optional(),
});

export const userLoginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

// Type inference from schemas
export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type AudioChunkInput = z.infer<typeof audioChunkSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
