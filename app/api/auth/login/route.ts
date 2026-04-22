import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
       return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isVerified) {
       return NextResponse.json({ error: "Invalid credentials or unverified account." }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: { email: user.email, role: user.role },
      redirect: user.isOnboarded ? "/dashboard" : "/onboarding",
    });

  } catch (error: any) {
    console.error("[login]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
