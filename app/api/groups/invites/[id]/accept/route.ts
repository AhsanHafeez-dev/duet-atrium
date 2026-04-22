import { NextResponse } from "next/server";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: inviteId } = await params;
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate Invitation
    const invitation = await prisma.groupInvitation.findUnique({
       where: { id: inviteId },
       include: { group: { include: { members: true } } }
    });

    if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (invitation.inviteeId !== payload.userId) return NextResponse.json({ error: "Unauthorized access to invitation" }, { status: 403 });
    if (invitation.status !== "PENDING") return NextResponse.json({ error: "Invitation is no longer valid" }, { status: 400 });
    if (invitation.expiresAt < new Date()) {
       await prisma.groupInvitation.update({ where: { id: inviteId }, data: { status: "EXPIRED" } });
       return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
    }

    // Check if user is already in a group
    const existingMembership = await prisma.groupMember.findUnique({
       where: { studentId: payload.userId }
    });

    if (existingMembership) {
       return NextResponse.json({ error: "You are already part of another group" }, { status: 400 });
    }

    const group = invitation.group;
    if (group.members.length >= group.maxSize) {
       return NextResponse.json({ error: "Group is already full" }, { status: 400 });
    }

    // Execute transaction to join group
    await prisma.$transaction([
       prisma.groupInvitation.update({
          where: { id: inviteId },
          data: { status: "ACCEPTED" }
       }),
       prisma.groupMember.create({
          data: {
             groupId: group.id,
             studentId: payload.userId,
             role: "MEMBER"
          }
       })
    ]);

    // Check if group meets minimum size (>=2). The logic typically waits for leader to activate, but we'll mark ACTIVE if size >= 2.
    if (group.members.length + 1 >= 2 && group.status === "FORMING") {
       await prisma.group.update({
          where: { id: group.id },
          data: { status: "ACTIVE" }
       });
    }

    return NextResponse.json({ success: true, message: "Invitation accepted" });

  } catch (error) {
    console.error("[POST /api/groups/invites/[id]/accept]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
