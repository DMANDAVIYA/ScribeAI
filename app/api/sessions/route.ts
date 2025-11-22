import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginationSchema } from "@/lib/validators";

/**
 * GET /api/sessions - List all sessions for a user
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        // Parse pagination params
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");

        const validation = paginationSchema.safeParse({ page, pageSize });
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: validation.error.message },
                { status: 400 }
            );
        }

        const skip = (page - 1) * pageSize;

        // Get sessions with transcript and summary
        const [sessions, total] = await Promise.all([
            prisma.session.findMany({
                where: { userId },
                include: {
                    transcript: {
                        select: {
                            content: true,
                        },
                    },
                    summary: {
                        select: {
                            content: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: pageSize,
            }),
            prisma.session.count({ where: { userId } }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                items: sessions,
                total,
                page,
                pageSize,
                hasMore: skip + pageSize < total,
            },
        });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch sessions" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sessions - Create a new session
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, audioSource, title } = body;

        if (!userId || !audioSource) {
            return NextResponse.json(
                { success: false, error: "User ID and audio source are required" },
                { status: 400 }
            );
        }

        const session = await prisma.session.create({
            data: {
                userId,
                audioSource,
                title: title || `Recording ${new Date().toLocaleString()}`,
                status: "IDLE",
            },
        });

        return NextResponse.json({ success: true, data: session }, { status: 201 });
    } catch (error) {
        console.error("Error creating session:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create session" },
            { status: 500 }
        );
    }
}
