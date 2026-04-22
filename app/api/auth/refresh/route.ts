import { NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();
    
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Issue new tokens
    const newPayload = {
       userId: payload.userId,
       email: payload.email,
       role: payload.role
    };
    
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    return NextResponse.json({ 
       success: true, 
       accessToken, 
       refreshToken: newRefreshToken 
    });

  } catch (error: any) {
    console.error("[refresh-token]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
