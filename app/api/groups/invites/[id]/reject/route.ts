import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: inviteId } = await params;
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate Invitation
    const invitation = await prisma.groupInvitation.findUnique({
       where: { id: inviteId }
    });

    if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (invitation.inviteeId !== payload.userId) return NextResponse.json({ error: "Unauthorized access to invitation" }, { status: 403 });

    // Update status to REJECTED
    await prisma.groupInvitation.update({
       where: { id: inviteId },
       data: { status: "REJECTED" }
    });

    return NextResponse.json({ success: true, message: "Invitation rejected" });

  } catch (error) {
    console.error("[POST /api/groups/invites/[id]/reject]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
