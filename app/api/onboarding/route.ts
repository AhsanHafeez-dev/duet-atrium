import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { uploadBase64Image } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    console.log("[Onboarding API] Payload received:", body);
    const { password, profileImageUrl, profileImageBase64 } = body;

    if (!password || password.length < 6) {
       return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    let dbUpdateData: any = {
      passwordHash,
      isOnboarded: true
    };

    if (body.hasOwnProperty('profileImageUrl') && body.profileImageUrl !== undefined) {
       dbUpdateData.profileImage = body.profileImageUrl;
    } else if (profileImageBase64) {
       try {
           dbUpdateData.profileImage = await uploadBase64Image(profileImageBase64);
       } catch (e) {
           console.error("[Image Upload Failed]", e);
       }
    }

    if (payload.role === "STUDENT") {
        const { rollNumber, batch, program } = body;
        if (!rollNumber || !batch || !program) {
            return NextResponse.json({ error: "All student fields are required" }, { status: 400 });
        }
        dbUpdateData = { ...dbUpdateData, rollNumber, batch, program };
    } else if (payload.role === "TEACHER") {
        const { designation, domainTags, bio } = body;
        if (!designation) {
            return NextResponse.json({ error: "Designation is required" }, { status: 400 });
        }
        dbUpdateData = { ...dbUpdateData, designation, bio, domainTags: domainTags || [] };
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: dbUpdateData
    });

    return NextResponse.json({ success: true, redirect: "/dashboard" });

  } catch (error: any) {
    console.error("[onboarding]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
