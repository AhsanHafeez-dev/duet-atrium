import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken, normalizeTitle } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload?.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const proposal = await prisma.proposal.findUnique({
       where: { id },
       include: {
          submittedBy: true,
          teacher: true,
          group: {
             include: {
                members: {
                   include: { student: true }
                }
             }
          },
          documents: true
       }
    });

    if (!proposal) {
       return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
 
    // Must be related to the group, the teacher evaluating it, or an admin
    if (payload.role === "STUDENT") {
       const isMember = proposal.group.members.some(m => m.studentId === payload.userId);
       if (!isMember) return NextResponse.json({ error: "Access denied: You are not a member of this project group." }, { status: 403 });
    } else if (payload.role === "TEACHER") {
       if (proposal.teacherId !== payload.userId) {
          console.warn(`[AUTH] Teacher ${payload.userId} attempted to access proposal ${id} assigned to ${proposal.teacherId}`);
          return NextResponse.json({ error: "Access denied: You are not the assigned supervisor for this proposal." }, { status: 403 });
       }
    } else if (payload.role !== "ADMIN") {
       return NextResponse.json({ error: "Access denied: Unauthorized role." }, { status: 403 });
    }
 
    return NextResponse.json({ success: true, proposal });


  } catch (error) {
    console.error("[GET /api/proposals/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, abstract, problemStatement, proposedStack, researchPapers, diagramUrl, presentationUrl } = await req.json();

    const proposal = await prisma.proposal.findUnique({
       where: { id },
       include: { group: { include: { members: true } } }
    });

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    // Validate ownership
    const membership = proposal.group.members.find(m => m.studentId === payload.userId);
    if (!membership || (membership.role !== "LEADER" && membership.role !== "CO_LEADER")) {
       return NextResponse.json({ error: "Only the Group Leader or Co-Leader can resubmit the proposal." }, { status: 403 });
    }

    if (proposal.status !== "REVISION_REQUESTED" && proposal.status !== "PENDING") {
       return NextResponse.json({ error: "Only proposals in PENDING or REVISION_REQUESTED status can be modified." }, { status: 400 });
    }

    const titleNormalized = title ? normalizeTitle(title) : proposal.titleNormalized;

    const updatedProposal = await prisma.proposal.update({
       where: { id },
       data: {
          title: title || proposal.title,
          titleNormalized,
          abstract: abstract || proposal.abstract,
          problemStatement: problemStatement || proposal.problemStatement,
          proposedStack: proposedStack || proposal.proposedStack,
          researchPapers: researchPapers || proposal.researchPapers,
          diagramUrl: diagramUrl || proposal.diagramUrl,
          presentationUrl: presentationUrl || proposal.presentationUrl,
          status: "PENDING", // Reset status to PENDING
          respondedAt: null,   // Clear previous response time
          submittedAt: new Date()
       }
    });

    // Notify Teacher
    createNotification({
       userId: proposal.teacherId,
       type: "PROPOSAL_SUBMITTED",
       message: `The proposal "${updatedProposal.title}" has been resubmitted with revisions by Group ${proposal.groupId}.`,
       relatedId: proposal.id
    }).catch(err => console.error("Notification failed", err));

    return NextResponse.json({ success: true, proposal: updatedProposal });

  } catch (error) {
    console.error("[PATCH /api/proposals/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
