import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
       where: { id: payload.userId },
       select: { id: true, email: true, designation: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const pendingProposals = await prisma.proposal.findMany({
       where: { teacherId: user.id, status: "PENDING" },
       include: {
          group: { include: { members: { include: { student: true } } } },
          submittedBy: { select: { email: true } }
       },
       orderBy: { submittedAt: "desc" }
    });

    const supervisedProposals = await prisma.proposal.findMany({
       where: { teacherId: user.id, status: "ACCEPTED" },
       include: {
          group: { include: { members: { include: { student: true } } } },
          submittedBy: { select: { email: true } }
       },
       orderBy: { submittedAt: "desc" }
    });

    return NextResponse.json({ 
       success: true, 
       user, 
       pendingProposals, 
       supervisedProposals 
    });

  } catch (error) {
    console.error("[GET /api/teacher/dashboard]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
