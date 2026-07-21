import { prisma } from "@kinetik/database";
import type { FastifyInstance } from "fastify";
import { computeAdherence } from "../services/adherence.js";

export async function clinicianRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  app.get("/dashboard", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }

    const clinician = await prisma.clinicianProfile.findUnique({ where: { userId: id } });
    if (!clinician) return reply.status(404).send({ error: "Clinician profile not found" });

    const patients = await prisma.patientProfile.findMany({
      where: { clinicianId: clinician.id },
      include: {
        user: true,
        checkIns: { orderBy: { date: "desc" }, take: 1 },
        readinessScores: { orderBy: { calculatedAt: "desc" }, take: 1 },
        alerts: { where: { isRead: false } },
      },
    });

    const summaries = await Promise.all(
      patients.map(async (p) => {
        const adherence = await computeAdherence(p.id);
        return {
          id: p.id,
          name: `${p.user.firstName} ${p.user.lastName}`,
          injuryType: p.injuryType,
          sport: p.sport,
          recoveryPhase: p.recoveryPhase,
          lastCheckIn: p.checkIns[0]?.date.toISOString(),
          painScore: p.checkIns[0]?.painScore,
          adherenceRate: adherence.rate,
          readinessScore: p.readinessScores[0]?.overallScore,
          unreadAlerts: p.alerts.length,
        };
      })
    );

    const allAlerts = await prisma.alert.findMany({
      where: {
        patient: { clinicianId: clinician.id },
        isRead: false,
      },
      include: { patient: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const avgAdherence =
      summaries.length > 0
        ? summaries.reduce((sum, p) => sum + p.adherenceRate, 0) / summaries.length
        : 0;

    const criticalAlerts = allAlerts.filter((a) => a.severity === "CRITICAL").length;

    return {
      data: {
        stats: {
          totalPatients: summaries.length,
          avgAdherence: Math.round(avgAdherence),
          criticalAlerts,
          patientsNeedingAttention: summaries.filter(
            (p) => p.unreadAlerts > 0 || (p.painScore ?? 0) >= 7 || p.adherenceRate < 50
          ).length,
        },
        patients: summaries,
        alerts: allAlerts.map((a) => ({
          id: a.id,
          patientId: a.patientId,
          patientName: `${a.patient.user.firstName} ${a.patient.user.lastName}`,
          type: a.type,
          severity: a.severity,
          message: a.message,
          createdAt: a.createdAt.toISOString(),
          isRead: a.isRead,
        })),
      },
    };
  });

  app.get("/patients/:patientId", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }

    const { patientId } = request.params as { patientId: string };

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: {
        user: true,
        checkIns: { orderBy: { date: "desc" }, take: 14 },
        readinessScores: { orderBy: { calculatedAt: "desc" }, take: 10 },
        programs: {
          where: { isActive: true },
          include: {
            exercises: { include: { exercise: true }, orderBy: { orderIndex: "asc" } },
          },
        },
        alerts: { orderBy: { createdAt: "desc" }, take: 10 },
        sessionLogs: {
          orderBy: { completedAt: "desc" },
          take: 15,
          include: { programExercise: { include: { exercise: true } } },
        },
      },
    });

    if (!patient) return reply.status(404).send({ error: "Patient not found" });

    const adherence = await computeAdherence(patient.id);
    const activeProgram = patient.programs[0];

    return {
      data: {
        id: patient.id,
        name: `${patient.user.firstName} ${patient.user.lastName}`,
        injuryType: patient.injuryType,
        sport: patient.sport,
        sportGoal: patient.sportGoal,
        comorbidities: patient.comorbidities,
        recoveryPhase: patient.recoveryPhase,
        adherenceRate: adherence.rate,
        readinessScore: patient.readinessScores[0]?.overallScore,
        checkInHistory: patient.checkIns,
        readinessHistory: patient.readinessScores.map((r) => ({
          overallScore: r.overallScore,
          physicalScore: r.physicalScore,
          psychologicalScore: r.psychologicalScore,
          adherenceScore: r.adherenceScore,
          functionalScore: r.functionalScore,
          recommendation: r.recommendation,
          calculatedAt: r.calculatedAt.toISOString(),
        })),
        activeProgram: activeProgram
          ? {
              programId: activeProgram.id,
              programName: activeProgram.name,
              exercises: activeProgram.exercises.map((pe) => ({
                id: pe.exercise.id,
                name: pe.exercise.name,
                description: pe.exercise.description,
                bodyRegion: pe.exercise.bodyRegion,
                sets: pe.sets,
                reps: pe.reps,
                orderIndex: pe.orderIndex,
              })),
            }
          : null,
        alerts: patient.alerts,
        recentSessions: patient.sessionLogs.map((s) => ({
          id: s.id,
          exerciseName: s.programExercise.exercise.name,
          completedAt: s.completedAt.toISOString(),
          durationSeconds: s.durationSeconds,
          setsCompleted: s.setsCompleted,
          repsCompleted: s.repsCompleted,
          formScore: s.formScore,
          painDuring: s.painDuring,
        })),
      },
    };
  });

  app.patch("/alerts/:alertId/read", async (request, reply) => {
    const { alertId } = request.params as { alertId: string };
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
    return { data: alert };
  });
}
