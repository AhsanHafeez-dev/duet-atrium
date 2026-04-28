import { NextResponse } from "next/server";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.userId) {
       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
         id: true,
         email: true,
         role: true,
         isOnboarded: true,
         rollNumber: true,
         batch: true,
         program: true,
         designation: true,
         membership: {
           select: {
             role: true,
             groupId: true
           }
         }
      }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error("[auth/me] Error:", error);
    
    // Check if it's a Prisma connection timeout
    if (error.message?.includes("Timed out") || error.code === "P1001") {
       return NextResponse.json({ 
          error: "Database temporary busy. Please refresh.", 
          code: "DB_TIMEOUT" 
       }, { status: 503 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
