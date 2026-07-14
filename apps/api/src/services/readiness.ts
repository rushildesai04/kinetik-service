import { prisma } from "@kinetik/database";
import { computeAdherence } from "./adherence.js";

function recommendation(score: number): string {
  if (score >= 80) return "Functional readiness indicators suggest you may begin sport-specific training with caution.";
  if (score >= 60) return "Continue building strength and confidence. Light activity progression is appropriate.";
  if (score >= 40) return "Focus on adherence and pain management. Return-to-sport is not yet recommended.";
  return "Recovery is in early stages. Prioritize daily exercises and check-ins with your clinician.";
}

export async function calculateReadiness(patientId: string) {
  const checkIns = await prisma.dailyCheckIn.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
    take: 14,
  });

  const surveys = await prisma.outcomeSurvey.findMany({
    where: { patientId },
    orderBy: { completedAt: "desc" },
    take: 1,
  });

  const adherence = await computeAdherence(patientId);

  const avgPain =
    checkIns.length > 0
      ? checkIns.reduce((sum, c) => sum + c.painScore, 0) / checkIns.length
      : 5;

  const avgConfidence =
    checkIns.length > 0
      ? checkIns.reduce((sum, c) => sum + c.confidenceScore, 0) / checkIns.length
      : 5;

  const physicalScore = Math.max(0, Math.min(100, (10 - avgPain) * 10));
  const psychologicalScore = avgConfidence * 10;
  const adherenceScore = adherence.rate;
  const functionalScore = surveys[0] ? Math.min(100, surveys[0].totalScore) : physicalScore * 0.7;

  const overallScore =
    physicalScore * 0.3 +
    psychologicalScore * 0.25 +
    adherenceScore * 0.25 +
    functionalScore * 0.2;

  const score = await prisma.readinessScore.create({
    data: {
      patientId,
      overallScore,
      physicalScore,
      psychologicalScore: psychologicalScore,
      adherenceScore,
      functionalScore,
      recommendation: recommendation(overallScore),
    },
  });

  if (overallScore >= 75 && overallScore < 80) {
    await prisma.alert.create({
      data: {
        patientId,
        type: "READINESS_MILESTONE",
        severity: "INFO",
        message: "Patient approaching return-to-sport readiness threshold (75%+)",
      },
    });
  }

  if (adherence.rate < 50) {
    await prisma.alert.create({
      data: {
        patientId,
        type: "LOW_ADHERENCE",
        severity: "WARNING",
        message: `Adherence dropped to ${Math.round(adherence.rate)}% over the last 30 days`,
      },
    });
  }

  return score;
}
