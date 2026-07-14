import { prisma } from "@kinetik/database";

export async function assignDefaultProgram(patientId: string, injuryType: string) {
  const existing = await prisma.assignedProgram.findFirst({
    where: { patientId, isActive: true },
  });
  if (existing) return existing;

  const exercises = await prisma.exercise.findMany({
    where: { isGlobal: true },
    orderBy: { difficulty: "asc" },
    take: 3,
  });

  if (exercises.length === 0) return null;

  return prisma.assignedProgram.create({
    data: {
      patientId,
      name: `${injuryType} Recovery Program`,
      isActive: true,
      frequency: "daily",
      exercises: {
        create: exercises.map((ex, i) => ({
          exerciseId: ex.id,
          sets: 3,
          reps: i === 2 ? 1 : 10,
          holdSeconds: i === 0 ? 5 : undefined,
          orderIndex: i,
        })),
      },
    },
  });
}

export function computeProgramProgress(
  startDate: Date,
  recoveryPhase: string
): { currentWeek: number; totalWeeks: number; percentComplete: number } {
  const totalWeeks = recoveryPhase === "RETURN_TO_SPORT" ? 12 : recoveryPhase === "POST_DISCHARGE" ? 8 : 16;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const currentWeek = Math.min(totalWeeks, Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / msPerWeek)));
  const percentComplete = Math.round((currentWeek / totalWeeks) * 100);
  return { currentWeek, totalWeeks, percentComplete };
}

export function rankFromAdherence(adherence: number): string {
  if (adherence >= 80) return "Top 10%";
  if (adherence >= 60) return "Top 25%";
  if (adherence >= 40) return "Building momentum";
  return "Getting started";
}

export function providerNoteFromData(
  readinessScore: number | undefined,
  painScore: number | undefined,
  adherence: number
): string {
  if (readinessScore != null && readinessScore >= 75) {
    return "Your readiness is trending toward return-to-sport thresholds. Maintain form quality and complete remaining sessions before adding sport-specific drills.";
  }
  if ((painScore ?? 0) >= 6) {
    return "Pain levels are elevated — prioritize recovery modalities and reduce session intensity. Reach out if symptoms persist beyond 48 hours.";
  }
  if (adherence < 50) {
    return "Consistency is the biggest lever right now. Even partial sessions count — aim for daily check-ins and at least one exercise per day.";
  }
  return "Keep rep count steady and focus on smooth form. Your readiness score reflects real progress when you stay consistent this week.";
}
