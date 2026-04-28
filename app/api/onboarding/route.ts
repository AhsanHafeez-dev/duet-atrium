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
    console.log("[Onboarding API] Full Body:", JSON.stringify(body, null, 2));
    
    const { password, profileImageUrl, profileImageBase64, rollNumber, batch, program, designation, domainTags, bio } = body;

    if (!password || password.length < 6) {
       return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const updateData: any = {
      passwordHash,
      isOnboarded: true
    };

    // Explicitly set profileImage if it's in the body (even if null to allow clearing)
    if (body.hasOwnProperty('profileImageUrl')) {
       updateData.profileImage = profileImageUrl;
    } else if (profileImageBase64) {
       try {
           updateData.profileImage = await uploadBase64Image(profileImageBase64);
       } catch (e) {
           console.error("[Image Upload Failed]", e);
       }
    }

    if (payload.role === "STUDENT") {
        if (!rollNumber || !batch || !program) {
            return NextResponse.json({ error: "All student fields are required" }, { status: 400 });
        }
        Object.assign(updateData, { rollNumber, batch, program });
    } else if (payload.role === "TEACHER") {
        if (!designation) {
            return NextResponse.json({ error: "Designation is required" }, { status: 400 });
        }
        Object.assign(updateData, { designation, bio, domainTags: domainTags || [] });
    }

    console.log("[Onboarding API] Final Update Data:", JSON.stringify(updateData, null, 2));

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData
    });

    console.log("[Onboarding API] User Updated successfully. DB State:", JSON.stringify({
       email: updatedUser.email,
       profileImage: updatedUser.profileImage
    }, null, 2));

    return NextResponse.json({ success: true, redirect: "/dashboard" });

  } catch (error: any) {
    console.error("[onboarding]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
