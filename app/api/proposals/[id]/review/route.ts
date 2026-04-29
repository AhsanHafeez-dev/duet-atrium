import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";
import { notifyGroup } from "@/lib/notifications";
import { ProposalStatus } from "@prisma/client";


export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, feedback, allowExtraMember } = await req.json();

    if (!["approve", "reject", "revise"].includes(action)) {
       return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const proposal = await prisma.proposal.findUnique({
       where: { id },
       include: { group: true }
    });

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    
    if (proposal.teacherId !== payload.userId) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (proposal.status !== "PENDING" && proposal.status !== "REVISION_REQUESTED") {
       return NextResponse.json({ error: "Proposal is no longer pending review or waiting for revision." }, { status: 400 });
    }


    let statusUpdate: ProposalStatus = "PENDING";
    if (action === "approve") statusUpdate = "APPROVED_BY_SUPERVISOR";
    if (action === "reject") statusUpdate = "REJECTED";
    if (action === "revise") statusUpdate = "REVISION_REQUESTED";


    // Transaction to update proposal and optionally reject other concurrent proposals if accepted
    await prisma.$transaction(async (tx) => {
       await tx.proposal.update({
          where: { id: proposal.id },
          data: {
             status: statusUpdate as any,
             rejectionComment: feedback || null,
             allowExtraMember: !!allowExtraMember
          }
       });

       if (action === "approve") {
          // If teacher allowed extra slot, update group maxSize
          if (allowExtraMember) {
             await tx.group.update({
                where: { id: proposal.groupId },
                data: { maxSize: 5 }
             });
          }

          // Reject other pending proposals for this group
          await tx.proposal.updateMany({
             where: { 
                groupId: proposal.groupId,
                id: { not: proposal.id },
                status: "PENDING"
             },
             data: { status: "REJECTED" }
          });
       }
    });

    // Trigger Notifications asynchronously
    let notificationType: any = "PROPOSAL_ACCEPTED";
    let message = `Your proposal "${proposal.title}" has been APPROVED by the supervisor. It is now waiting for final Admin approval.`;
    
    if (action === "reject") {
       notificationType = "PROPOSAL_REJECTED";
       message = `Your proposal "${proposal.title}" has been REJECTED.`;
    } else if (action === "revise") {
       notificationType = "PROPOSAL_SUBMITTED"; // Or add PROPOSAL_REVISION_REQUESTED to enum if available
       message = `A revision has been requested for your proposal "${proposal.title}".`;
    }
            
    notifyGroup({
       groupId: proposal.groupId,
       type: notificationType,
       message,
       relatedId: proposal.id
    }).catch(err => console.error("Notification failed", err));

    return NextResponse.json({ success: true, message: `Proposal ${statusUpdate}` });

  } catch (error) {
    console.error("[POST /api/proposals/[id]/review]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
