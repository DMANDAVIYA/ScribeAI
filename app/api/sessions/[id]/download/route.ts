import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sessions/[id]/download - Download session transcript/summary
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get("format") || "txt";

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

        let content = "";
        let contentType = "text/plain";
        let filename = `session-${id}`;

        if (format === "json") {
            content = JSON.stringify(
                {
                    session: {
                        id: session.id,
                        title: session.title,
                        duration: session.duration,
                        createdAt: session.createdAt,
                    },
                    transcript: session.transcript?.content || "",
                    summary: session.summary || null,
                },
                null,
                2
            );
            contentType = "application/json";
            filename += ".json";
        } else {
            // Default to text format
            content = `Session: ${session.title}\n`;
            content += `Date: ${session.createdAt.toLocaleString()}\n`;
            content += `Duration: ${Math.floor(session.duration / 60)}m ${session.duration % 60}s\n\n`;
            content += `=== TRANSCRIPT ===\n\n`;
            content += session.transcript?.content || "No transcript available";

            if (session.summary) {
                content += `\n\n=== SUMMARY ===\n\n`;
                content += session.summary.content + "\n\n";

                if (session.summary.keyPoints && Array.isArray(session.summary.keyPoints)) {
                    content += `Key Points:\n`;
                    (session.summary.keyPoints as string[]).forEach((point, i) => {
                        content += `${i + 1}. ${point}\n`;
                    });
                }

                if (session.summary.actionItems && Array.isArray(session.summary.actionItems)) {
                    content += `\nAction Items:\n`;
                    (session.summary.actionItems as string[]).forEach((item, i) => {
                        content += `${i + 1}. ${item}\n`;
                    });
                }

                if (session.summary.decisions && Array.isArray(session.summary.decisions)) {
                    content += `\nDecisions:\n`;
                    (session.summary.decisions as string[]).forEach((decision, i) => {
                        content += `${i + 1}. ${decision}\n`;
                    });
                }
            }

            filename += ".txt";
        }

        return new NextResponse(content, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error downloading session:", error);
        return NextResponse.json(
            { success: false, error: "Failed to download session" },
            { status: 500 }
        );
    }
}
