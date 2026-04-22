import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supervisedGroups = await prisma.group.findMany({
      where: {
        proposals: {
          some: {
            teacherId: payload.userId,
            status: "ACCEPTED"
          }
        }
      },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                email: true,
                rollNumber: true,
                program: true,
                profileImage: true
              }
            }
          }
        },
        proposals: {
          where: {
            teacherId: payload.userId,
            status: "ACCEPTED"
          }
        }
      }
    });

    return NextResponse.json({ success: true, groups: supervisedGroups });

  } catch (error) {
    console.error("[GET /api/teacher/groups]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
