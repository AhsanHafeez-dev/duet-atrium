import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    const unreadCount = await prisma.notification.count({
      where: { 
         userId: payload.userId,
         isRead: false
      }
    });

    return NextResponse.json({ success: true, notifications, unreadCount });

  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Mark all as read
export async function PATCH(req: Request) {
   try {
     const token = getServerAuthToken(req);
     if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
     const payload = verifyAccessToken(token);
     if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
     await prisma.notification.updateMany({
       where: { 
          userId: payload.userId,
          isRead: false
       },
       data: { isRead: true }
     });
 
     return NextResponse.json({ success: true });
 
   } catch (error) {
     console.error("[PATCH /api/notifications]", error);
     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
   }
 }
