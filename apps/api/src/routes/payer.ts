import { prisma } from "@kinetik/database";
import type { FastifyInstance } from "fastify";

export async function payerRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  app.get("/dashboard", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PAYER") return reply.status(403).send({ error: "Payers only" });

    const payer = await prisma.payerProfile.findUnique({
      where: { userId: id },
      include: { payerOrg: true },
    });
    if (!payer) return reply.status(404).send({ error: "Payer profile not found" });

    const patients = await prisma.patientProfile.findMany({
      include: {
        user: true,
        readinessScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
        checkIns: { orderBy: { date: "desc" }, take: 1 },
        rtmEnrollment: {
          include: {
            dayLogs: true,
            claimExports: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        sessionLogs: { orderBy: { completedAt: "desc" }, take: 5 },
      },
      take: 50,
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const cohort = patients.map((p) => {
      const days =
        p.rtmEnrollment?.dayLogs.filter((d) => d.date >= monthStart && d.hasData).length ?? 0;
      return {
        id: p.id,
        name: `${p.user.firstName} ${p.user.lastName}`,
        injuryType: p.injuryType,
        sport: p.sport,
        recoveryPhase: p.recoveryPhase,
        readinessScore: p.readinessScores[0]?.overallScore,
        latestPain: p.checkIns[0]?.painScore,
        rtmEnrolled: !!p.rtmEnrollment,
        rtmDataDays: days,
        rtmQualifies: days >= 16,
        lastClaimCpt: p.rtmEnrollment?.claimExports[0]?.cptCodes ?? [],
        sessionsRecent: p.sessionLogs.length,
      };
    });

    const avgReadiness =
      cohort.filter((c) => c.readinessScore != null).reduce((s, c) => s + (c.readinessScore ?? 0), 0) /
        Math.max(1, cohort.filter((c) => c.readinessScore != null).length) || 0;

    return {
      data: {
        organization: payer.payerOrg.name,
        region: payer.payerOrg.region,
        stats: {
          coveredPatients: cohort.length,
          rtmEnrolled: cohort.filter((c) => c.rtmEnrolled).length,
          rtmQualifiedThisMonth: cohort.filter((c) => c.rtmQualifies).length,
          avgReadiness: Math.round(avgReadiness),
          highPainFlags: cohort.filter((c) => (c.latestPain ?? 0) >= 7).length,
        },
        cohort,
        valueNarrative:
          "Kinetik reduces avoidable re-injury and PT readmission risk through continuous RTM adherence + readiness monitoring — aligned to shared-savings models (Kaiser / Blue Shield beachhead).",
      },
    };
  });
}
