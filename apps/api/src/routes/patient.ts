import { prisma } from "@kinetik/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { calculateReadiness } from "../services/readiness.js";
import { computeAdherence } from "../services/adherence.js";
import {
  computeProgramProgress,
  providerNoteFromData,
  rankFromAdherence,
} from "../services/program.js";
import { generateSupportReply } from "../services/support.js";
import { awardXp, getGamification } from "../services/gamification.js";
import { logRtmDay, ensureRtmEnrollment } from "../services/rtm.js";
import { adaptProgramForPatient } from "../services/adaptive.js";

const checkInSchema = z.object({
  painScore: z.number().min(0).max(10),
  confidenceScore: z.number().min(0).max(10),
  moodNote: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
});

const sessionSchema = z.object({
  programExerciseId: z.string(),
  setsCompleted: z.number().min(0),
  repsCompleted: z.number().min(0),
  durationSeconds: z.number().min(0).optional(),
  painDuring: z.number().min(0).max(10).optional(),
  formScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
});

const workoutFeedbackSchema = z.object({
  painScore: z.number().min(0).max(10),
  difficulty: z.number().min(0).max(10),
  comments: z.string().max(1000).optional(),
  exerciseSessionId: z.string().optional(),
});

async function buildDashboard(profileId: string) {
  const profile = await prisma.patientProfile.findUnique({
    where: { id: profileId },
    include: {
      user: true,
      clinician: { include: { user: true } },
      checkIns: { orderBy: { date: "desc" }, take: 7 },
      readinessScores: { orderBy: { calculatedAt: "desc" }, take: 2 },
      programs: {
        where: { isActive: true },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      },
    },
  });

  if (!profile) return null;

  if (profile.checkIns.length > 0 && profile.readinessScores.length === 0) {
    await calculateReadiness(profile.id);
    const refreshed = await prisma.readinessScore.findMany({
      where: { patientId: profile.id },
      orderBy: { calculatedAt: "desc" },
      take: 2,
    });
    profile.readinessScores = refreshed;
  }

  const activeProgram = profile.programs[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = activeProgram
    ? await prisma.exerciseSession.findMany({
        where: {
          patientId: profile.id,
          completedAt: { gte: today },
          programExerciseId: { in: activeProgram.exercises.map((e) => e.id) },
        },
      })
    : [];

  const completedIds = new Set(todaySessions.map((s) => s.programExerciseId));
  const adherence = await computeAdherence(profile.id);
  const latestReadiness = profile.readinessScores[0];
  const previousReadiness = profile.readinessScores[1];
  const readinessDelta =
    latestReadiness && previousReadiness
      ? latestReadiness.overallScore - previousReadiness.overallScore
      : undefined;

  const programProgress = activeProgram
    ? computeProgramProgress(activeProgram.startDate, profile.recoveryPhase)
    : null;

  const repsToday = todaySessions.reduce((sum, s) => sum + s.repsCompleted, 0);
  const avgFormScore =
    todaySessions.length > 0
      ? todaySessions.reduce((sum, s) => sum + (s.formScore ?? 0), 0) / todaySessions.length
      : undefined;

  const exercisesTotal = activeProgram?.exercises.length ?? 0;
  const exercisesCompleted = completedIds.size;

  return {
    recoveryPhase: profile.recoveryPhase,
    injuryType: profile.injuryType,
    sport: profile.sport,
    sportGoal: profile.sportGoal,
    clinician: profile.clinician
      ? {
          name: `${profile.clinician.user.firstName} ${profile.clinician.user.lastName}`,
          specialty: profile.clinician.specialty,
        }
      : null,
    todaysProgram: activeProgram
      ? {
          programId: activeProgram.id,
          programName: activeProgram.name,
          startDate: activeProgram.startDate.toISOString(),
          exercises: activeProgram.exercises.map((pe) => ({
            id: pe.exercise.id,
            programExerciseId: pe.id,
            name: pe.exercise.name,
            description: pe.exercise.description,
            bodyRegion: pe.exercise.bodyRegion,
            videoUrl: pe.exercise.videoUrl,
            sets: pe.sets,
            reps: pe.reps,
            holdSeconds: pe.holdSeconds,
            orderIndex: pe.orderIndex,
          })),
          completedToday: [...completedIds],
          adherenceStreak: adherence.streak,
        }
      : null,
    programProgress,
    adherenceRate: adherence.rate,
    rankText: rankFromAdherence(adherence.rate),
    providerNote: providerNoteFromData(
      latestReadiness?.overallScore,
      profile.checkIns[0]?.painScore,
      adherence.rate
    ),
    todayStats: {
      repsCompleted: repsToday,
      avgFormScore,
      exercisesCompleted,
      exercisesTotal,
    },
    latestCheckIn: profile.checkIns[0]
      ? {
          painScore: profile.checkIns[0].painScore,
          confidenceScore: profile.checkIns[0].confidenceScore,
          moodNote: profile.checkIns[0].moodNote,
          date: profile.checkIns[0].date.toISOString(),
        }
      : null,
    readiness: latestReadiness
      ? {
          overallScore: latestReadiness.overallScore,
          physicalScore: latestReadiness.physicalScore,
          psychologicalScore: latestReadiness.psychologicalScore,
          adherenceScore: latestReadiness.adherenceScore,
          functionalScore: latestReadiness.functionalScore,
          recommendation: latestReadiness.recommendation,
          calculatedAt: latestReadiness.calculatedAt.toISOString(),
          delta: readinessDelta,
        }
      : null,
  };
}

export async function patientRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  app.get("/dashboard", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const data = await buildDashboard(profile.id);
    return { data };
  });

  app.post("/check-in", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });

    const body = checkInSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIn = await prisma.dailyCheckIn.upsert({
      where: { patientId_date: { patientId: profile.id, date: today } },
      create: {
        patientId: profile.id,
        date: today,
        painScore: body.data.painScore,
        confidenceScore: body.data.confidenceScore,
        moodNote: body.data.moodNote,
        symptoms: body.data.symptoms ?? [],
      },
      update: {
        painScore: body.data.painScore,
        confidenceScore: body.data.confidenceScore,
        moodNote: body.data.moodNote,
        symptoms: body.data.symptoms ?? [],
      },
    });

    if (body.data.painScore >= 7) {
      await prisma.alert.create({
        data: {
          patientId: profile.id,
          type: "HIGH_PAIN",
          severity: body.data.painScore >= 9 ? "CRITICAL" : "WARNING",
          message: `Patient reported pain score of ${body.data.painScore}/10`,
        },
      });
    }

    await calculateReadiness(profile.id);
    await ensureRtmEnrollment(profile.id);
    await logRtmDay(profile.id, { minutes: 2, source: "check_in" });
    const gamification = await awardXp(id, 25, "daily check-in");

    return { data: { ...checkIn, gamification } };
  });

  app.post("/sessions", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });

    const body = sessionSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const session = await prisma.exerciseSession.create({
      data: {
        patientId: profile.id,
        programExerciseId: body.data.programExerciseId,
        setsCompleted: body.data.setsCompleted,
        repsCompleted: body.data.repsCompleted,
        durationSeconds: body.data.durationSeconds,
        painDuring: body.data.painDuring,
        formScore: body.data.formScore,
        notes: body.data.notes,
      },
    });

    await calculateReadiness(profile.id);
    const minutes = Math.max(5, Math.round((body.data.durationSeconds ?? 300) / 60));
    await logRtmDay(profile.id, { minutes, source: "session" });
    const gamification = await awardXp(id, 50, "exercise session completed");

    if (body.data.formScore != null && body.data.formScore < 60) {
      await prisma.alert.create({
        data: {
          patientId: profile.id,
          type: "FORM_DEGRADATION",
          severity: "WARNING",
          message: `Form score dropped to ${Math.round(body.data.formScore)}% during session`,
        },
      });
    }

    return reply.status(201).send({ data: { ...session, gamification } });
  });

  app.post("/workout-feedback", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });

    const body = workoutFeedbackSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const feedback = await prisma.workoutFeedback.create({
      data: {
        patientId: profile.id,
        painScore: body.data.painScore,
        difficulty: body.data.difficulty,
        comments: body.data.comments,
        exerciseSessionId: body.data.exerciseSessionId,
      },
    });

    if (body.data.painScore >= 7) {
      await prisma.alert.create({
        data: {
          patientId: profile.id,
          type: "HIGH_PAIN",
          severity: body.data.painScore >= 9 ? "CRITICAL" : "WARNING",
          message: `Patient reported pain score of ${body.data.painScore}/10 after completing a workout.`,
        },
      });
    }

    const adaptation = await adaptProgramForPatient(profile.id);
    await awardXp(id, 15, "workout feedback submitted");

    return reply.status(201).send({ data: { ...feedback, adaptation } });
  });

  app.get("/readiness", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const scores = await prisma.readinessScore.findMany({
      where: { patientId: profile.id },
      orderBy: { calculatedAt: "desc" },
      take: 30,
    });

    return { data: scores };
  });

  app.post("/support/chat", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });

    const body = chatSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const dashboard = await buildDashboard(profile.id);
    if (!dashboard) return reply.status(404).send({ error: "Profile not found" });

    const replyText = generateSupportReply(body.data.message, {
      injuryType: dashboard.injuryType,
      sport: dashboard.sport ?? undefined,
      recoveryPhase: dashboard.recoveryPhase,
      adherenceRate: dashboard.adherenceRate,
      readinessScore: dashboard.readiness?.overallScore,
      readinessRecommendation: dashboard.readiness?.recommendation,
      painScore: dashboard.latestCheckIn?.painScore,
      confidenceScore: dashboard.latestCheckIn?.confidenceScore,
      exercisesRemaining:
        dashboard.todayStats.exercisesTotal - dashboard.todayStats.exercisesCompleted,
      exercisesTotal: dashboard.todayStats.exercisesTotal,
      streak: dashboard.todaysProgram?.adherenceStreak ?? 0,
    });

    return { data: { reply: replyText } };
  });

  app.get("/report", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const dashboard = await buildDashboard(profile.id);
    if (!dashboard) return reply.status(404).send({ error: "Profile not found" });

    const scores = await prisma.readinessScore.findMany({
      where: { patientId: profile.id },
      orderBy: { calculatedAt: "desc" },
      take: 7,
    });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const sessions = await prisma.exerciseSession.findMany({
      where: { patientId: profile.id, completedAt: { gte: weekStart } },
    });

    const report = {
      generatedAt: new Date().toISOString(),
      patient: {
        injuryType: dashboard.injuryType,
        sport: dashboard.sport,
        recoveryPhase: dashboard.recoveryPhase,
      },
      summary: {
        adherenceRate: dashboard.adherenceRate,
        streak: dashboard.todaysProgram?.adherenceStreak ?? 0,
        sessionsThisWeek: sessions.length,
        repsThisWeek: sessions.reduce((sum, s) => sum + s.repsCompleted, 0),
        latestPain: dashboard.latestCheckIn?.painScore,
        latestConfidence: dashboard.latestCheckIn?.confidenceScore,
        readinessScore: dashboard.readiness?.overallScore,
        recommendation: dashboard.readiness?.recommendation,
      },
      readinessTrend: scores.map((s) => ({
        date: s.calculatedAt.toISOString(),
        overallScore: s.overallScore,
        physicalScore: s.physicalScore,
        psychologicalScore: s.psychologicalScore,
        adherenceScore: s.adherenceScore,
        functionalScore: s.functionalScore,
      })),
    };

    return { data: report };
  });

  app.get("/gamification", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });
    const data = await getGamification(id);
    if (!data) return reply.status(404).send({ error: "Profile not found" });
    return { data };
  });

  app.get("/surveys", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });
    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });
    const surveys = await prisma.outcomeSurvey.findMany({
      where: { patientId: profile.id },
      orderBy: { completedAt: "desc" },
    });
    return { data: surveys };
  });

  app.post("/surveys", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });
    const schema = z.object({
      surveyType: z.enum(["KOOS", "IKDC", "CUSTOM"]),
      scores: z.record(z.number()),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const values = Object.values(body.data.scores);
    const totalScore = values.length
      ? (values.reduce((a, b) => a + b, 0) / values.length) * 10
      : 0;

    const survey = await prisma.outcomeSurvey.create({
      data: {
        patientId: profile.id,
        surveyType: body.data.surveyType,
        scores: body.data.scores,
        totalScore: Math.min(100, totalScore),
      },
    });

    await calculateReadiness(profile.id);
    await awardXp(id, 75, `${body.data.surveyType} outcome survey`);
    await logRtmDay(profile.id, { minutes: 5, source: "survey" });

    return reply.status(201).send({ data: survey });
  });

  app.get("/devices", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });
    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });
    const devices = await prisma.device.findMany({
      where: { patientId: profile.id },
      include: { sessions: { orderBy: { startedAt: "desc" }, take: 3 } },
    });
    return { data: devices };
  });

  app.post("/devices/pair", async (request, reply) => {
    const { id, role } = request.user as { id: string; role: string };
    if (role !== "PATIENT") return reply.status(403).send({ error: "Patients only" });
    const schema = z.object({
      type: z.enum(["EMG_BAND", "IMU", "COMBINED", "CAMERA_ONLY"]),
      label: z.string().optional(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const profile = await prisma.patientProfile.findUnique({ where: { userId: id } });
    if (!profile) return reply.status(404).send({ error: "Profile not found" });

    const serial = `KIN-${body.data.type.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}`;
    const device = await prisma.device.create({
      data: {
        patientId: profile.id,
        clinicId: profile.clinicId,
        type: body.data.type,
        status: "ACTIVE",
        serialNumber: serial,
        label: body.data.label ?? `Kinetik ${body.data.type.replace(/_/g, " ")}`,
        lastSeenAt: new Date(),
      },
    });

    // Seed a demo sensor session so dashboards aren't empty
    const session = await prisma.sensorSession.create({
      data: {
        deviceId: device.id,
        patientId: profile.id,
        exerciseName: "Baseline calibration",
        endedAt: new Date(),
        summary: {
          emgRmsMv: 0.42,
          imuPeakRomDeg: 68,
          samples: 120,
          quality: "good",
        },
        samples: {
          create: [
            { channel: "emg_ch1", value: 0.38, unit: "mV" },
            { channel: "emg_ch1", value: 0.45, unit: "mV" },
            { channel: "imu_gyro", value: 12.4, unit: "deg/s" },
            { channel: "imu_accel", value: 0.98, unit: "g" },
          ],
        },
      },
    });

    await logRtmDay(profile.id, { minutes: 3, source: "sensor" });
    await awardXp(id, 40, "device paired");

    return reply.status(201).send({ data: { device, session } });
  });
}
