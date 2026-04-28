import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let announcements: any[] = [];

    if (payload.role === "ADMIN") {
      announcements = await prisma.announcement.findMany({
        include: { author: { select: { email: true, role: true } } },
        orderBy: { createdAt: "desc" }
      });
    } else if (payload.role === "STUDENT") {
      const membership = await prisma.groupMember.findUnique({
        where: { studentId: payload.userId },
        include: { group: { include: { proposals: { where: { status: "ACCEPTED" } } } } }
      });

      const supervisorId = membership?.group?.proposals[0]?.teacherId;

      announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            { targetType: "ALL" },
            { targetType: "STUDENTS_ONLY" },
            { AND: [{ targetType: "ALL_SUPERVISED" }, { authorId: supervisorId }] },
            { targetGroupId: membership?.groupId }
          ]
        },
        include: { author: { select: { email: true, role: true } } },
        orderBy: { createdAt: "desc" }
      });
    } else if (payload.role === "TEACHER") {
      announcements = await prisma.announcement.findMany({
        where: {
          OR: [
            { targetType: "ALL" },
            { targetType: "TEACHERS_ONLY" },
            { authorId: payload.userId }
          ]
        },
        include: { author: { select: { email: true, role: true } } },
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({ success: true, announcements });

  } catch (error) {
    console.error("[GET /api/announcements]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || (payload.role !== "ADMIN" && payload.role !== "TEACHER")) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, targetType, targetGroupId } = await req.json();

    if (!title || !body || !targetType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        body,
        targetType,
        targetGroupId,
        authorId: payload.userId
      }
    });

    return NextResponse.json({ success: true, announcement });

  } catch (error) {
    console.error("[POST /api/announcements]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
