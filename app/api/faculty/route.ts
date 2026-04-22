import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || !payload.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const faculty = await prisma.user.findMany({
      where: { 
         role: "TEACHER",
         isVerified: true,
         isOnboarded: true
      },
      select: {
        id: true,
        email: true,
        designation: true,
        domainTags: true,
        bio: true,
        supervisedProposals: {
           where: { status: "ACCEPTED" }, // active supervision count
           select: { id: true }
        }
      }
    });

    return NextResponse.json({ success: true, faculty });

  } catch (error) {
    console.error("[GET /api/faculty]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
