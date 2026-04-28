import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, normalizeTitle, getServerAuthToken } from "@/lib/auth";
import { uploadBase64Image, uploadBase64Document } from "@/lib/cloudinary";
import { createNotification } from "@/lib/notifications";


export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (payload.role === "STUDENT") {
      const membership = await prisma.groupMember.findUnique({
        where: { studentId: payload.userId },
        include: { group: { include: { proposals: { include: { teacher: { select: { email: true, designation: true } } } } } } }
      });
      return NextResponse.json({ success: true, proposals: membership?.group?.proposals || [] });
    }

    if (payload.role === "TEACHER") {
      const proposals = await prisma.proposal.findMany({
        where: { teacherId: payload.userId },
        include: { group: { include: { members: { include: { student: true } } } }, submittedBy: { select: { email: true } } },
        orderBy: { submittedAt: "desc" }
      });
      return NextResponse.json({ success: true, proposals });
    }

    if (payload.role === "ADMIN") {
      const proposals = await prisma.proposal.findMany({
        include: { 
          teacher: { select: { email: true, designation: true } },
          group: true,
          submittedBy: { select: { email: true } }
        },
        orderBy: { submittedAt: "desc" }
      });
      return NextResponse.json({ success: true, proposals });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  } catch (error) {
    console.error("[GET /api/proposals]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, abstract, problemStatement, proposedStack, researchPapers, teacherId, diagramBase64, presentationBase64, diagramUrl: bodyDiagramUrl, presentationUrl: bodyPresentationUrl } = await req.json();

    if (!title || !abstract || !problemStatement || !teacherId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Must be group leader
    const membership = await prisma.groupMember.findUnique({
       where: { studentId: payload.userId },
       include: { group: { include: { proposals: true } } }
    });

    if (!membership || membership.role !== "LEADER") {
       return NextResponse.json({ error: "Only the Group Leader can submit a proposal." }, { status: 403 });
    }

    const group = membership.group;

    // Restriction: cannot submit if one is already APPROVED_BY_SUPERVISOR
    const hasApproved = group.proposals.some((p: any) => p.status === "APPROVED_BY_SUPERVISOR");
    if (hasApproved) {
       return NextResponse.json({ error: "Your group already has a proposal waiting for Admin approval. Please wait for the final decision." }, { status: 400 });
    }

    // Check concurrent pending proposals
    const pendingCount = group.proposals.filter((p: any) => p.status === "PENDING").length;
    if (pendingCount >= 3) {
       return NextResponse.json({ error: "Maximum concurrent proposals (3) reached." }, { status: 400 });
    }

    const hasAccepted = group.proposals.some((p: any) => p.status === "ACCEPTED");
    if (hasAccepted) {
       return NextResponse.json({ error: "Your group already has an accepted proposal." }, { status: 400 });
    }

    const titleNormalized = normalizeTitle(title);

    // Check duplicate per teacher
    const existingForTeacher = await prisma.proposal.findUnique({
       where: {
          teacherId_titleNormalized: {
             teacherId,
             titleNormalized
          }
       }
    });

    if (existingForTeacher) {
       return NextResponse.json({ error: "A proposal with a similar title has already been submitted to this teacher." }, { status: 409 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Handle Optional File Uploads
    let diagramUrl = null;
    let presentationUrl = null;

    if (diagramBase64) {
       diagramUrl = await uploadBase64Image(diagramBase64, "proposals_diagrams");
    } else if (bodyDiagramUrl) {
       diagramUrl = bodyDiagramUrl;
    }

    if (presentationBase64) {
       presentationUrl = await uploadBase64Document(presentationBase64, "proposals_presentations");
    } else if (bodyPresentationUrl) {
       presentationUrl = bodyPresentationUrl;
    }

    const proposal = await prisma.proposal.create({
       data: {
          groupId: group.id,
          teacherId,
          title,
          titleNormalized,
          abstract,
          problemStatement,
          proposedStack: proposedStack || [],
          researchPapers: researchPapers || [],
          diagramUrl,
          presentationUrl,
          expiresAt,
          submittedById: payload.userId
       }
    });

    // Trigger notification to Teacher
    createNotification({
       userId: teacherId,
       type: "PROPOSAL_SUBMITTED",
       message: `A new proposal "${title}" has been submitted for your review by Group ${group.id}.`,
       relatedId: proposal.id
    }).catch(err => console.error("Notification failed", err));

    return NextResponse.json({ success: true, proposal });

  } catch (error) {
    console.error("[POST /api/proposals]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
