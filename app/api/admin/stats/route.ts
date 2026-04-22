import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthToken, verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [studentCount, teacherCount, groupCount, pendingProposals, portalConfig] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.group.count({ where: { status: "ACTIVE" } }),
      prisma.proposal.count({ where: { status: "PENDING" } }),
      prisma.portalConfig.findUnique({ where: { id: 1 } })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        studentCount,
        teacherCount,
        groupCount,
        pendingProposals,
        isLocked: portalConfig?.isLocked || false,
      }
    });

  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
