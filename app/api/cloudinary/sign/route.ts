import { NextResponse } from "next/server";
import { generateSignedUploadParams } from "@/lib/auth"; // Wait, I put it in lib/cloudinary.ts
import { generateSignedUploadParams as signParams } from "@/lib/cloudinary";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { folder } = await req.json();
    
    const signedParams = signParams(folder || "uploads");

    return NextResponse.json(signedParams);

  } catch (error) {
    console.error("[Cloudinary Signing Error]", error);
    return NextResponse.json({ error: "Failed to generate signature" }, { status: 500 });
  }
}
