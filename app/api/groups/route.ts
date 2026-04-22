import { NextResponse } from "next/server";
import { verifyAccessToken, generateGroupId, getServerAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Fetch the current user's group
export async function GET(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.groupMember.findUnique({
      where: { studentId: payload.userId },
      include: {
         group: {
            include: {
               leader: true,
               coLeader: true,
               members: { include: { student: true } },
               invitations: { 
                 where: { status: "PENDING" },
                 include: { invitee: true }
               },
               proposals: true
            }
         }
      }
    });


    if (!member) {
       // Check for pending Invitations
       const invitation = await prisma.groupInvitation.findFirst({
          where: { 
            inviteeId: payload.userId,
            status: "PENDING",
            expiresAt: { gt: new Date() }
          },
          include: { 
            group: {
               include: {
                  leader: true,
                  members: { include: { student: true } }
               }
            }
          }
       });

       if (invitation) {
          return NextResponse.json({ 
            success: true, 
            group: null, // User is not in a group
            pendingInvitation: invitation 
          });
       }

       return NextResponse.json({ success: true, group: null });
    }

    return NextResponse.json({ 
      success: true, 
      group: member.group,
      userStatus: "ACCEPTED", // They are already in the group
      userRole: member.role   // "LEADER" | "CO_LEADER" | "MEMBER"
    });

  } catch (error) {
    console.error("[GET /api/groups]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Form a new group
export async function POST(req: Request) {
  try {
    const token = getServerAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = verifyAccessToken(token);
    if (!payload || payload.role !== "STUDENT") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure student is not already in a group
    const existingMembership = await prisma.groupMember.findUnique({
       where: { studentId: payload.userId }
    });

    if (existingMembership) {
       return NextResponse.json({ error: "You are already in a group." }, { status: 400 });
    }

    // Create Group
    const groupId = generateGroupId();
    
    const group = await prisma.group.create({
       data: {
          id: groupId,
          leaderId: payload.userId,
          status: "FORMING",
          members: {
             create: {
                studentId: payload.userId,
                role: "LEADER"
             }
          }
       }
    });

    return NextResponse.json({ success: true, group });

  } catch (error) {
    console.error("[POST /api/groups]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
