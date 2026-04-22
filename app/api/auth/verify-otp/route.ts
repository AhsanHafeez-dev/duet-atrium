import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // If already verified, re-issue tokens and redirect (idempotent)
    if (user.isVerified) {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = signAccessToken(payload);
      const refreshToken = signRefreshToken(payload);

      return NextResponse.json({
        success: true,
        accessToken,
        refreshToken,
        user: { role: user.role },
        redirect: user.isOnboarded ? "/dashboard" : "/onboarding",
      });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 401 });
    }

    // Mark as verified & clear OTP
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      }
    });

    const payload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: { role: updatedUser.role },
      redirect: updatedUser.isOnboarded ? "/dashboard" : "/onboarding",
    });

  } catch (error: any) {
    console.error("[verify-otp]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
