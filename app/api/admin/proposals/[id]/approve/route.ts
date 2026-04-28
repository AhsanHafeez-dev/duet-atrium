import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";
import { notifyGroup } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { group: true }
    });

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    if (proposal.status !== "APPROVED_BY_SUPERVISOR") {
      return NextResponse.json({ error: "Proposal must be approved by supervisor first." }, { status: 400 });
    }

    // Finalize approval
    await prisma.$transaction(async (tx) => {
      // 1. Update proposal status
      await tx.proposal.update({
        where: { id },
        data: { status: "ACCEPTED" }
      });

      // 2. Reject other pending proposals for this group (if any remained)
      await tx.proposal.updateMany({
        where: {
          groupId: proposal.groupId,
          id: { not: id },
          status: { in: ["PENDING", "APPROVED_BY_SUPERVISOR"] }
        },
        data: { status: "REJECTED" }
      });

      // 3. Update group status to ACTIVE and assign the supervisor
      await tx.group.update({
        where: { id: proposal.groupId },
        data: { 
           status: "ACTIVE",
           supervisorId: proposal.teacherId
        }
      });
    });

    // Notify Group
    notifyGroup({
      groupId: proposal.groupId,
      type: "PROPOSAL_ACCEPTED",
      message: `Congratulations! Your proposal "${proposal.title}" has received final Admin approval. Your supervisor is now officially allotted.`,
      relatedId: proposal.id
    }).catch(err => console.error("Notification failed", err));

    return NextResponse.json({ success: true, message: "Proposal finalized successfully." });

  } catch (error) {
    console.error("[ADMIN_PROPOSAL_APPROVE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
