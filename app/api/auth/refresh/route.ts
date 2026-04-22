import { NextResponse } from "next/server";
import { verifyRefreshToken, signAccessToken, COOKIE_OPTIONS } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const refreshToken = (await cookies()).get("refresh_token")?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // Issue new access token
    const accessToken = signAccessToken({
       userId: payload.userId,
       email: payload.email,
       role: payload.role
    });

    (await cookies()).set("access_token", accessToken, {
       ...COOKIE_OPTIONS,
       maxAge: 60 * 60, // 1 hour
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[refresh-token]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
