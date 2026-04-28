import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by Vercel Cron at 2AM daily
// Deletes unverified user accounts older than 24 hours
export async function GET(req: Request) {
  // Security: only allow Vercel cron calls or internal calls
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !req.headers.get("x-vercel-cron")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const result = await prisma.user.deleteMany({
      where: {
        isVerified: false,
        createdAt: { lt: cutoff },
      },
    });

    console.log(`[cron/cleanup-unverified] Deleted ${result.count} unverified accounts.`);
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error("[cron/cleanup-unverified]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
