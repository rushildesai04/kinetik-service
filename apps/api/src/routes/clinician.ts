import { prisma } from "@kinetik/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { computeAdherence } from "../services/adherence.js";
import {
  buildRtmClaim,
  getClinicRtmSummary,
  logRtmCommunication,
  ensureRtmEnrollment,
} from "../services/rtm.js";
import { adaptProgramForPatient } from "../services/adaptive.js";

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
          include: {
            programExercise: { include: { exercise: true } },
            workoutFeedback: true,
          },
        },
        workoutFeedback: { where: { exerciseSessionId: null }, orderBy: { submittedAt: "desc" }, take: 10 },
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
          feedback: s.workoutFeedback[0]
            ? {
                painScore: s.workoutFeedback[0].painScore,
                difficulty: s.workoutFeedback[0].difficulty,
                comments: s.workoutFeedback[0].comments,
                submittedAt: s.workoutFeedback[0].submittedAt.toISOString(),
              }
            : null,
        })),
        recentWorkoutFeedback: patient.workoutFeedback.map((f) => ({
          id: f.id,
          painScore: f.painScore,
          difficulty: f.difficulty,
          comments: f.comments,
          submittedAt: f.submittedAt.toISOString(),
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

  app.get("/rtm", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const clinician = await prisma.clinicianProfile.findUnique({ where: { userId: id } });
    if (!clinician) return reply.status(404).send({ error: "Clinician profile not found" });
    const patients = await getClinicRtmSummary(clinician.id);
    return { data: { patients, month: new Date().toISOString().slice(0, 7) } };
  });

  app.post("/rtm/:patientId/enroll", async (request, reply) => {
    const { role } = request.user as { role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const { patientId } = request.params as { patientId: string };
    const enrollment = await ensureRtmEnrollment(patientId);
    return { data: enrollment };
  });

  app.post("/rtm/:patientId/communication", async (request, reply) => {
    const { role } = request.user as { role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const { patientId } = request.params as { patientId: string };
    const body = z
      .object({ minutes: z.number().min(1).max(120), note: z.string().optional() })
      .safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    await logRtmCommunication(patientId, body.data.minutes, body.data.note);
    return { data: { ok: true } };
  });

  app.post("/rtm/:patientId/claim", async (request, reply) => {
    const { role } = request.user as { role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const { patientId } = request.params as { patientId: string };
    const claim = await buildRtmClaim(patientId);
    if (!claim) return reply.status(404).send({ error: "Patient not enrolled in RTM" });
    return { data: claim };
  });

  app.get("/ehr", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user?.clinicId) return { data: [] };
    const connections = await prisma.ehrConnection.findMany({
      where: { clinicId: user.clinicId },
    });
    return { data: connections };
  });

  app.post("/ehr/connect", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const body = z
      .object({ vendor: z.enum(["EPIC", "ATHENA", "PRACTICE_FUSION", "WEBPT", "OTHER"]) })
      .safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user?.clinicId) return reply.status(400).send({ error: "No clinic associated" });

    const connection = await prisma.ehrConnection.upsert({
      where: { clinicId_vendor: { clinicId: user.clinicId, vendor: body.data.vendor } },
      create: {
        clinicId: user.clinicId,
        vendor: body.data.vendor,
        status: "CONNECTED",
        connectedAt: new Date(),
        lastSyncAt: new Date(),
        externalOrgId: `demo-${body.data.vendor.toLowerCase()}-${user.clinicId.slice(-6)}`,
        metadata: { mode: "sandbox", fhir: true },
      },
      update: {
        status: "CONNECTED",
        connectedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    return { data: connection };
  });

  app.post("/ehr/:vendor/sync", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const { vendor } = request.params as { vendor: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user?.clinicId) return reply.status(400).send({ error: "No clinic associated" });

    const connection = await prisma.ehrConnection.updateMany({
      where: { clinicId: user.clinicId, vendor: vendor.toUpperCase() as "EPIC" },
      data: { lastSyncAt: new Date(), status: "CONNECTED" },
    });

    return {
      data: {
        synced: connection.count > 0,
        patientsImported: 0,
        notesWritten: 0,
        message: "Sandbox sync complete — roster and adherence summaries refreshed.",
      },
    };
  });

  app.get("/billing", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user?.clinicId) return reply.status(400).send({ error: "No clinic associated" });

    const clinic = await prisma.clinic.findUnique({
      where: { id: user.clinicId },
      include: { patients: true, subscription: true },
    });
    if (!clinic) return reply.status(404).send({ error: "Clinic not found" });

    const seats = clinic.patients.length;
    const price = clinic.subscription?.pricePerPatient ?? 80;
    const sub =
      clinic.subscription ??
      (await prisma.clinicSubscription.create({
        data: {
          clinicId: clinic.id,
          status: "ACTIVE",
          pricePerPatient: 80,
          activeSeats: seats,
          billingEmail: user.email,
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      }));

    if (sub.activeSeats !== seats) {
      await prisma.clinicSubscription.update({
        where: { id: sub.id },
        data: { activeSeats: seats },
      });
    }

    return {
      data: {
        clinicName: clinic.name,
        status: sub.status,
        pricePerPatient: price,
        activeSeats: seats,
        monthlyTotal: seats * price,
        currentPeriodEnd: (sub.currentPeriodEnd ?? new Date()).toISOString(),
        model: "SaaS to clinics — $80/patient/month",
      },
    };
  });

  app.post("/patients/:patientId/notes", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const { patientId } = request.params as { patientId: string };
    const body = z.object({ body: z.string().min(1).max(5000) }).safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const note = await prisma.clinicianNote.create({
      data: { patientId, authorId: id, body: body.data.body },
    });
    return reply.status(201).send({ data: note });
  });

  app.post("/patients/:patientId/adapt-program", async (request, reply) => {
    const { role } = request.user as { role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const { patientId } = request.params as { patientId: string };
    const result = await adaptProgramForPatient(patientId);
    if (!result) return reply.status(404).send({ error: "No active program" });
    return { data: result };
  });

  app.patch("/patients/:patientId/program", async (request, reply) => {
    const { role } = request.user as { role: string };
    if (role !== "CLINICIAN" && role !== "CLINIC_ADMIN") {
      return reply.status(403).send({ error: "Clinicians only" });
    }
    const { patientId } = request.params as { patientId: string };
    const body = z
      .object({
        exercises: z.array(
          z.object({
            programExerciseId: z.string(),
            sets: z.number().min(1).max(10).optional(),
            reps: z.number().min(1).max(50).optional(),
          })
        ),
      })
      .safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const updates = [];
    for (const ex of body.data.exercises) {
      updates.push(
        await prisma.programExercise.update({
          where: { id: ex.programExerciseId },
          data: {
            ...(ex.sets != null ? { sets: ex.sets } : {}),
            ...(ex.reps != null ? { reps: ex.reps } : {}),
          },
        })
      );
    }
    return { data: updates };
  });
}
