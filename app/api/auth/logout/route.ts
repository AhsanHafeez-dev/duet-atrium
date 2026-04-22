import { NextResponse } from "next/server";

export async function POST() {
  // Since we are using localStorage, the client handles clearing the tokens.
  // This endpoint can be used to perform any server-side cleanup if needed.
  return NextResponse.json({ success: true, redirect: "/auth/login" });
}
