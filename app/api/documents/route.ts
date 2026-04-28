import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, getServerAuthToken } from "@/lib/auth";

// Fetch documents for the user's group
export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload || !payload.role) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let documents: any[] = [];

    const commonIncludes = { 
       uploader: { select: { email: true, role: true } },
       group: { select: { id: true } }
    };

    if (payload.role === "ADMIN") {
       // Admins see everything
       documents = await prisma.document.findMany({
          include: commonIncludes,
          orderBy: { createdAt: "desc" }
       });
    } else if (payload.role === "STUDENT") {
       const membership = await prisma.groupMember.findUnique({
          where: { studentId: payload.userId },
          include: { 
             group: { 
                include: { 
                   proposals: { where: { status: "ACCEPTED" } } 
                } 
             } 
          }
       });

       const acceptedProposal = membership?.group?.proposals[0];
       const supervisorId = acceptedProposal?.teacherId;

       documents = await prisma.document.findMany({
          where: {
             OR: [
                { targetType: "ALL" },
                { targetType: "STUDENTS_ONLY" },
                { groupId: membership?.groupId },
                { 
                   AND: [
                      { targetType: "SUPERVISED_ONLY" },
                      { uploaderId: supervisorId }
                   ]
                }
             ]
          },
          include: commonIncludes,
          orderBy: { createdAt: "desc" }
       });
    } else if (payload.role === "TEACHER") {
       // Teachers fetch documents for groups they supervise + global docs
       const supervisedProposals = await prisma.proposal.findMany({
          where: { teacherId: payload.userId, status: "ACCEPTED" },
          select: { groupId: true }
       });
       const groupIds = supervisedProposals.map((p: any) => p.groupId);
       
       documents = await prisma.document.findMany({
          where: {
             OR: [
                { targetType: "ALL" },
                { targetType: "TEACHERS_ONLY" },
                { groupId: { in: groupIds } },
                { uploaderId: payload.userId } // Their own uploads
             ]
          },
          include: commonIncludes,
          orderBy: { createdAt: "desc" }
       });
    }

    return NextResponse.json({ success: true, documents });

  } catch (error) {
    console.error("[GET /api/documents]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Upload a document
export async function POST(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, fileUrl, targetType, targetGroupId, groupId } = await req.json();

    if (!title || !fileUrl) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let docData: any = {
       filename: title,
       url: fileUrl,
       uploaderId: payload.userId,
       publicId: "placeholder",
       fileType: fileUrl.split('.').pop() || "pdf",
       fileSize: 0,
       status: "REVIEWED"
    };

    if (payload.role === "STUDENT") {
       const membership = await prisma.groupMember.findUnique({
          where: { studentId: payload.userId }
       });
       if (!membership) {
          return NextResponse.json({ error: "No group membership found" }, { status: 403 });
       }
       docData.groupId = membership.groupId;
       docData.targetType = "GROUP_SPECIFIC";
       docData.status = "PENDING_REVIEW";
    } else if (payload.role === "ADMIN") {
       docData.targetType = targetType || "ALL";
    } else if (payload.role === "TEACHER") {
       docData.targetType = targetType || "SUPERVISED_ONLY";
       if (targetType === "GROUP_SPECIFIC" && targetGroupId) {
          docData.groupId = targetGroupId;
       }
    }

    const document = await prisma.document.create({ data: docData });

    return NextResponse.json({ success: true, document });

  } catch (error) {
    console.error("[POST /api/documents]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
