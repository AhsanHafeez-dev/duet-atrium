import { prisma } from "../lib/prisma";

async function check() {
  const proposal = await prisma.proposal.findFirst({
    include: { teacher: true }
  });
  console.log("Proposal Teacher ID:", proposal?.teacherId);
  console.log("Proposal Object Keys:", Object.keys(proposal || {}));
}

check();
