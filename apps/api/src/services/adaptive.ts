import { prisma } from "@kinetik/database";

/**
 * Adapt HEP load based on latest workout feedback + check-in.
 * High pain / high difficulty → reduce reps; low pain + high confidence → nudge up.
 */
export async function adaptProgramForPatient(patientId: string) {
  const program = await prisma.assignedProgram.findFirst({
    where: { patientId, isActive: true },
    include: { exercises: { orderBy: { orderIndex: "asc" } } },
  });
  if (!program || program.exercises.length === 0) return null;

  const [feedback, checkIn] = await Promise.all([
    prisma.workoutFeedback.findFirst({
      where: { patientId },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.dailyCheckIn.findFirst({
      where: { patientId },
      orderBy: { date: "desc" },
    }),
  ]);

  const pain = feedback?.painScore ?? checkIn?.painScore ?? 3;
  const difficulty = feedback?.difficulty ?? 5;
  const confidence = checkIn?.confidenceScore ?? 5;

  let delta = 0;
  let reason = "Holding current load — insufficient signal to adapt.";

  if (pain >= 7 || difficulty >= 8) {
    delta = -2;
    reason = "Pain/difficulty elevated — reducing reps to protect tissue load.";
  } else if (pain <= 3 && difficulty <= 4 && confidence >= 7) {
    delta = 2;
    reason = "Low pain + high confidence — progressing reps for overload.";
  } else if (pain <= 4 && confidence >= 6) {
    delta = 1;
    reason = "Stable recovery markers — slight progression.";
  }

  if (delta === 0) {
    return { adapted: false, reason, exercises: program.exercises };
  }

  const updated = [];
  for (const pe of program.exercises) {
    const nextReps = Math.max(5, Math.min(20, pe.reps + delta));
    const row = await prisma.programExercise.update({
      where: { id: pe.id },
      data: { reps: nextReps },
    });
    updated.push(row);
  }

  await prisma.alert.create({
    data: {
      patientId,
      type: "READINESS_MILESTONE",
      severity: "INFO",
      message: `AI guidance adapted program: ${reason}`,
    },
  });

  return { adapted: true, reason, delta, exercises: updated };
}
