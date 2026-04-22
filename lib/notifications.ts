import { prisma } from "./prisma";

export type NotificationType = 
  | "GROUP_INVITATION"
  | "INVITE_ACCEPTED"
  | "INVITE_REJECTED"
  | "PROPOSAL_SUBMITTED"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_REJECTED"
  | "PROPOSAL_REVISION_REQUESTED"
  | "ANNOUNCEMENT"
  | "PROGRESS_REPORT_REQUEST"
  | "DOCUMENT_SUBMITTED"
  | "GROUP_FROZEN"
  | "MEMBER_REMOVED";

export async function createNotification({
  userId,
  type,
  message,
  relatedId
}: {
  userId: string;
  type: any;
  message: string;
  relatedId?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedId,
        isRead: false
      }
    });
  } catch (error) {
    console.error("[createNotification] Error:", error);
  }
}

export async function notifyGroup({
  groupId,
  type,
  message,
  relatedId,
  excludeUserId
}: {
  groupId: string;
  type: any;
  message: string;
  relatedId?: string;
  excludeUserId?: string;
}) {
  try {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { studentId: true }
    });

    const notifications = members
      .filter(m => m.studentId !== excludeUserId)
      .map(m => ({
        userId: m.studentId,
        type,
        message,
        relatedId,
        isRead: false
      }));

    if (notifications.length > 0) {
      return await prisma.notification.createMany({
        data: notifications
      });
    }
  } catch (error) {
    console.error("[notifyGroup] Error:", error);
  }
}
