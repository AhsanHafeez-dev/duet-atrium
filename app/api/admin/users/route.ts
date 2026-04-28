import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthToken, verifyAccessToken } from "@/lib/auth";

// GET /api/admin/users - List all users
export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const users = await prisma.user.findMany({
      where: {
        AND: [
          role ? { role: role as any } : {},
          search ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { rollNumber: { contains: search, mode: "insensitive" } },
            ]
          } : {}
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isOnboarded: true,
        rollNumber: true,
        designation: true,
        program: true,
        profileImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, users });

  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update user details
export async function PATCH(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId, updates } = await req.json();
    if (!userId || !updates) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // Restrict what an admin can update via this endpoint
    const allowedUpdates = ["isVerified", "role", "designation"];
    const filteredUpdates: any = {};
    for (const key of Object.keys(updates)) {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: filteredUpdates,
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("[PATCH /api/admin/users]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
