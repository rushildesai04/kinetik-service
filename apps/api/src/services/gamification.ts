import { prisma } from "@kinetik/database";

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000];

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export async function awardXp(userId: string, amount: number, reason: string) {
  await prisma.xpEvent.create({ data: { userId, amount, reason } });

  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) return null;

  const newXp = patient.xpTotal + amount;
  const newLevel = levelFromXp(newXp);

  await prisma.patientProfile.update({
    where: { id: patient.id },
    data: { xpTotal: newXp, level: newLevel },
  });

  const unlocked: Array<{ code: string; title: string; description: string }> = [];

  const checks: Array<{ code: string; title: string; description: string; ok: boolean }> = [
    {
      code: "FIRST_SESSION",
      title: "First Reps",
      description: "Completed your first exercise session",
      ok: reason.includes("session"),
    },
    {
      code: "FIRST_CHECKIN",
      title: "Checked In",
      description: "Logged your first daily check-in",
      ok: reason.includes("check-in"),
    },
    {
      code: "LEVEL_3",
      title: "Building Momentum",
      description: "Reached recovery level 3",
      ok: newLevel >= 3,
    },
    {
      code: "LEVEL_5",
      title: "Return-Ready Contender",
      description: "Reached recovery level 5",
      ok: newLevel >= 5,
    },
    {
      code: "XP_500",
      title: "Half-Thousand Club",
      description: "Earned 500 XP",
      ok: newXp >= 500,
    },
  ];

  for (const c of checks) {
    if (!c.ok) continue;
    try {
      await prisma.achievement.create({
        data: {
          userId,
          code: c.code,
          title: c.title,
          description: c.description,
        },
      });
      unlocked.push({ code: c.code, title: c.title, description: c.description });
    } catch {
      // already earned
    }
  }

  return { xpTotal: newXp, level: newLevel, unlocked };
}

export async function getGamification(userId: string) {
  const patient = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!patient) return null;

  const [achievements, recentXp] = await Promise.all([
    prisma.achievement.findMany({
      where: { userId },
      orderBy: { earnedAt: "desc" },
    }),
    prisma.xpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const nextThreshold = LEVEL_THRESHOLDS[patient.level] ?? patient.xpTotal + 500;
  const prevThreshold = LEVEL_THRESHOLDS[patient.level - 1] ?? 0;

  return {
    xpTotal: patient.xpTotal,
    level: patient.level,
    nextLevelXp: nextThreshold,
    progressPct: Math.min(
      100,
      Math.round(((patient.xpTotal - prevThreshold) / Math.max(1, nextThreshold - prevThreshold)) * 100)
    ),
    achievements,
    recentXp,
  };
}
