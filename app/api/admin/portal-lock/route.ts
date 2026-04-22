import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthToken, verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Authenticate & Authorize
    const token = getServerAuthToken(req);
    if (!token) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    const { lock } = await req.json();

    if (typeof lock !== "boolean") {
       return NextResponse.json({ error: "Invalid payload. 'lock' must be boolean." }, { status: 400 });
    }

    // 2. Perform the lock/unlock
    const config = await prisma.portalConfig.upsert({
      where: { id: 1 },
      update: {
        isLocked: lock,
        lockedAt: lock ? new Date() : null,
        lockedById: lock ? payload.userId : null,
      },
      create: {
        id: 1,
        isLocked: lock,
        lockedAt: lock ? new Date() : null,
        lockedById: lock ? payload.userId : null,
      }
    });

    return NextResponse.json({ success: true, isLocked: config.isLocked });

  } catch (error: any) {
    console.error("[portal-lock] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
