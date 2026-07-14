import { prisma } from "@kinetik/database";

export async function computeAdherence(patientId: string): Promise<{ rate: number; streak: number }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activeProgram = await prisma.assignedProgram.findFirst({
    where: { patientId, isActive: true },
    include: { exercises: true },
  });

  if (!activeProgram || activeProgram.exercises.length === 0) {
    return { rate: 0, streak: 0 };
  }

  const expectedPerDay = activeProgram.exercises.length;
  const sessions = await prisma.exerciseSession.findMany({
    where: {
      patientId,
      completedAt: { gte: thirtyDaysAgo },
    },
  });

  const sessionsByDay = new Map<string, number>();
  for (const s of sessions) {
    const day = s.completedAt.toISOString().split("T")[0];
    sessionsByDay.set(day, (sessionsByDay.get(day) ?? 0) + 1);
  }

  let completedDays = 0;
  for (const [, count] of sessionsByDay) {
    if (count >= expectedPerDay * 0.5) completedDays++;
  }

  const rate = Math.min(100, (completedDays / 30) * 100);

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const count = sessionsByDay.get(key) ?? 0;
    if (count >= expectedPerDay * 0.5) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { rate, streak };
}
