import { PrismaClient, Role, GroupStatus, ProposalStatus, DocumentStatus } from "@prisma/client";
import { generateGroupId } from "../lib/auth";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Dynamically hash "12345678"
  const passwordHash = await bcrypt.hash("12345678", 10);
  console.log("Calculated password hash successfully.");

  // 1. Core Config
  await prisma.portalConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, isLocked: false },
  });

  // 2. Admin
  await prisma.user.upsert({
    where: { email: "admin@duet.edu.pk" },
    update: { passwordHash },
    create: {
      email: "admin@duet.edu.pk",
      passwordHash,
      role: Role.ADMIN,
      isVerified: true,
      isOnboarded: true,
      profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
    }
  });

  // 3. Teachers (10)
  const teacherIds: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const email = `teacher${i}@duet.edu.pk`;
    const teacher = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        passwordHash,
        role: Role.TEACHER,
        isVerified: true,
        isOnboarded: true,
        designation: i % 2 === 0 ? "Assistant Professor" : "Lecturer",
        domainTags: ["Machine Learning", "IoT", "Web Dev"],
        bio: `Teacher ${i} biography...`,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=teacher${i}`
      }
    });
    teacherIds.push(teacher.id);
  }

  // 4. Students (30)
  const studentIds: string[] = [];
  for (let i = 1; i <= 30; i++) {
    const email = `s${i}@students.duet.edu.pk`;
    const student = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        email,
        passwordHash,
        role: Role.STUDENT,
        isVerified: true,
        isOnboarded: true,
        rollNumber: `22F-BSCS-${i.toString().padStart(2, '0')}`,
        batch: "Fall 2022",
        program: "BSCS",
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`
      }
    });
    studentIds.push(student.id);
  }

  console.log("Users created.");

  // 5. Groups and Proposals
  // Wait, let's clear existing groups/proposals first to avoid constraint clashes locally
  await prisma.document.deleteMany({});
  await prisma.proposal.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.group.deleteMany({});

  const groupConfigs = [
    { tId: teacherIds[0], gStatus: GroupStatus.ACTIVE, pStatus: ProposalStatus.ACCEPTED, sIndices: [0, 1, 2] },
    { tId: teacherIds[1], gStatus: GroupStatus.FORMING, pStatus: ProposalStatus.PENDING, sIndices: [3, 4] },
    { tId: teacherIds[2], gStatus: GroupStatus.FORMING, pStatus: ProposalStatus.REJECTED, sIndices: [5, 6, 7] },
    { tId: teacherIds[3], gStatus: GroupStatus.FORMING, pStatus: ProposalStatus.WITHDRAWN, sIndices: [8] },
    { tId: teacherIds[4], gStatus: GroupStatus.FORMING, pStatus: ProposalStatus.EXPIRED, sIndices: [9, 10] },
    { tId: teacherIds[5], gStatus: GroupStatus.FROZEN, pStatus: ProposalStatus.ACCEPTED, sIndices: [11, 12, 13] },
    { tId: teacherIds[6], gStatus: GroupStatus.DISSOLVED, pStatus: ProposalStatus.REJECTED, sIndices: [14, 15] },
    { tId: teacherIds[7], gStatus: GroupStatus.ACTIVE, pStatus: ProposalStatus.ACCEPTED, sIndices: [16, 17, 18], docs: true },
  ];

  for (let idx = 0; idx < groupConfigs.length; idx++) {
    const config = groupConfigs[idx];
    const groupName = generateGroupId();
    
    // Create Group
    const group = await prisma.group.create({
      data: {
        id: groupName,
        leaderId: studentIds[config.sIndices[0]],
        status: config.gStatus,
      }
    });

    // Add members to Group
    const membersData = config.sIndices.map((sIdx, i) => ({
      groupId: group.id,
      studentId: studentIds[sIdx],
      role: i === 0 ? "LEADER" : "MEMBER"
    }));

    // Using any for the role type just for seed brevity
    await prisma.groupMember.createMany({
      data: membersData as any
    });

    // Create Proposal
    const proposalTitle = `FYP Proposal for Group ${idx + 1}`;
    const proposal = await prisma.proposal.create({
      data: {
        title: proposalTitle,
        titleNormalized: proposalTitle.toLowerCase(),
        abstract: "This is a detailed abstract for the seeded proposal.",
        problemStatement: "The problem statement...",
        proposedStack: ["React", "Node.js", "PostgreSQL"],
        status: config.pStatus,
        groupId: group.id,
        teacherId: config.tId,
        submittedById: studentIds[config.sIndices[0]],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Add document if configured
    if (config.docs) {
      await prisma.document.create({
        data: {
          groupId: group.id,
          proposalId: proposal.id,
          uploaderId: studentIds[config.sIndices[0]],
          filename: "Project_Proposal.pdf",
          publicId: "seed-doc-123",
          url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileType: "pdf",
          fileSize: 15400,
          status: DocumentStatus.PENDING_REVIEW,
        }
      });
    }
  }

  console.log("8 Groups with varied Proposal combinations created successfully.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
