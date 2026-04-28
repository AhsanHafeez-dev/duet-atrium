import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by Vercel Cron at 3AM daily
// Expires proposals that have been pending for > 7 days
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !req.headers.get("x-vercel-cron")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    const result = await prisma.proposal.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now },
      },
      data: { status: "EXPIRED" },
    });

    console.log(`[cron/expire-proposals] Expired ${result.count} proposals.`);
    return NextResponse.json({ success: true, expired: result.count });
  } catch (error) {
    console.error("[cron/expire-proposals]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
