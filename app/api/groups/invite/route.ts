import { NextResponse } from "next/server";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email } = await req.json();

    if (!email) {
       return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Must be group leader
    const membership = await prisma.groupMember.findUnique({
       where: { studentId: payload.userId },
       include: { group: { include: { members: true, invitations: true } } }
    });

    if (!membership || membership.role !== "LEADER") {
       return NextResponse.json({ error: "Only the Group Leader can invite members." }, { status: 403 });
    }

    const group = membership.group;

    if (group.members.length + group.invitations.filter((i: any) => i.status === "PENDING").length >= group.maxSize) {
       return NextResponse.json({ error: `Group cannot exceed ${group.maxSize} members.` }, { status: 400 });
    }

    // Check invitee
    const invitee = await prisma.user.findUnique({ where: { email } });
    
    if (!invitee || invitee.role !== "STUDENT" || !invitee.isVerified) {
       return NextResponse.json({ error: "Invitee must be a verified student." }, { status: 400 });
    }

    if (invitee.id === payload.userId) {
       return NextResponse.json({ error: "You cannot invite yourself." }, { status: 400 });
    }

    const existingTargetMembership = await prisma.groupMember.findUnique({
       where: { studentId: invitee.id }
    });

    if (existingTargetMembership) {
       return NextResponse.json({ error: "Invitee is already in a group." }, { status: 400 });
    }

    // Check if pending invite already exists
    const existingInvite = await prisma.groupInvitation.findFirst({
       where: {
          inviteeId: invitee.id,
          groupId: group.id,
          status: "PENDING"
       }
    });

    if (existingInvite) {
       return NextResponse.json({ error: "Invitation already sent." }, { status: 400 });
    }

    // Create Invite
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    const invite = await prisma.groupInvitation.create({
       data: {
          groupId: group.id,
          senderId: payload.userId,
          inviteeId: invitee.id,
          expiresAt
       }
    });

    return NextResponse.json({ success: true, invite });

  } catch (error) {
    console.error("[POST /api/groups/invite]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
