
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const email = "22f-bscs-27@students.duet.edu.pk";
  const user = await prisma.user.findUnique({ where: { email } });
  console.log("User found:", JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

check();
