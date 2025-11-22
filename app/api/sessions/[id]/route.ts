import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sessions/[id] - Get session details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const session = await prisma.session.findUnique({
            where: { id },
            include: {
                transcript: true,
                summary: true,
            },
        });

        if (!session) {
            return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: session });
    } catch (error) {
        console.error("Error fetching session:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch session" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/sessions/[id] - Update session
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, status } = body;

        const session = await prisma.session.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(status && { status }),
            },
        });

        return NextResponse.json({ success: true, data: session });
    } catch (error) {
        console.error("Error updating session:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update session" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/sessions/[id] - Delete session
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.session.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, data: { deleted: true } });
    } catch (error) {
        console.error("Error deleting session:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete session" },
            { status: 500 }
        );
    }
}
