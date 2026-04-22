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

    if (payload.role === "STUDENT") {
       const membership = await prisma.groupMember.findUnique({
          where: { studentId: payload.userId }
       });
       if (membership) {
          documents = await prisma.document.findMany({
             where: { groupId: membership.groupId },
             include: { uploader: { select: { email: true } } },
             orderBy: { createdAt: "desc" }
          });
       }
    } else if (payload.role === "TEACHER") {
       // Teachers fetch documents for groups they supervise
       const supervisedProposals = await prisma.proposal.findMany({
          where: { teacherId: payload.userId, status: "ACCEPTED" },
          select: { groupId: true }
       });
       const groupIds = supervisedProposals.map((p: any) => p.groupId);
       
       documents = await prisma.document.findMany({
          where: { groupId: { in: groupIds } },
          include: { 
             uploader: { select: { email: true } },
             group: { select: { id: true } }
          },
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
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, fileUrl, documentType } = await req.json();

    if (!title || !fileUrl || !documentType) {
       return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const membership = await prisma.groupMember.findUnique({
       where: { studentId: payload.userId }
    });

    if (!membership) {
       return NextResponse.json({ error: "You must be in a group to upload documents" }, { status: 403 });
    }

    const document = await prisma.document.create({
       data: {
          groupId: membership.groupId,
          uploaderId: payload.userId,
          filename: title,
          publicId: "placeholder",
          fileType: "pdf",
          fileSize: 1024,
          url: fileUrl
       }
    });

    return NextResponse.json({ success: true, document });

  } catch (error) {
    console.error("[POST /api/documents]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
