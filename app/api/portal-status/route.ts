import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // Only allow internal calls (e.g., from middleware)
  const isInternal = req.headers.get("x-internal") === "1";
  if (!isInternal) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const config = await prisma.portalConfig.findUnique({
      where: { id: 1 },
      select: { isLocked: true },
    });
    return NextResponse.json({ isLocked: config?.isLocked || false });
  } catch (error) {
    return NextResponse.json({ isLocked: false }, { status: 500 });
  }
}
