import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teacherEmail = 'teacher1@duet.edu.pk'; // Common pattern
  // Let's find any teacher first to be sure
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' }
  });

  console.log('Teachers found:', teachers.map(t => ({ id: t.id, email: t.email })));

  const teacher = teachers.find(t => t.email.includes('teacher1'));

  if (!teacher) {
    console.log('Teacher not found with email containing "teacher1"');
    return;
  }

  const proposals = await prisma.proposal.findMany({
    where: { teacherId: teacher.id },
    include: {
      group: true
    }
  });

  console.log(`Proposals for ${teacher.email}:`, JSON.stringify(proposals, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
