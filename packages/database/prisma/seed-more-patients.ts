import bcrypt from "bcryptjs";
import { prisma } from "@kinetik/database";

const EXERCISE_IDS = ["ex-quad-set", "ex-heel-slide", "ex-single-leg-stand"];

interface PatientSpec {
  email: string;
  firstName: string;
  lastName: string;
  injuryType: string;
  sport: string;
  sportGoal: string;
  recoveryPhase: "IN_CLINIC_PT" | "POST_DISCHARGE" | "RETURN_TO_SPORT" | "MAINTENANCE";
  painScore: number;
  confidenceScore: number;
  moodNote: string;
  sessionDayOffsets: number[];
  adherenceScore: number;
  alerts: Array<{
    type: "MISSED_SESSIONS" | "HIGH_PAIN" | "LOW_ADHERENCE" | "FORM_DEGRADATION" | "READINESS_MILESTONE" | "SURVEY_DUE";
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
  }>;
}

const patients: PatientSpec[] = [
  {
    email: "alex.martinez@kinetik.demo",
    firstName: "Alex",
    lastName: "Martinez",
    injuryType: "ACL Reconstruction",
    sport: "Soccer",
    sportGoal: "Return to competitive club soccer",
    recoveryPhase: "RETURN_TO_SPORT",
    painScore: 1,
    confidenceScore: 9,
    moodNote: "Feeling strong, cutting drills went well today",
    sessionDayOffsets: Array.from({ length: 26 }, (_, i) => i),
    adherenceScore: 87,
    alerts: [],
  },
  {
    email: "jordan.lee@kinetik.demo",
    firstName: "Jordan",
    lastName: "Lee",
    injuryType: "Rotator Cuff Repair",
    sport: "Baseball",
    sportGoal: "Return to competitive pitching",
    recoveryPhase: "POST_DISCHARGE",
    painScore: 8,
    confidenceScore: 3,
    moodNote: "Shoulder flared up badly after yesterday's session",
    sessionDayOffsets: [0, 3, 7, 12, 20],
    adherenceScore: 17,
    alerts: [
      {
        type: "HIGH_PAIN",
        severity: "CRITICAL",
        message: "Pain score of 8/10 reported today — highest in 2 weeks.",
      },
      {
        type: "LOW_ADHERENCE",
        severity: "WARNING",
        message: "Adherence dropped to 17% over the past 30 days.",
      },
    ],
  },
  {
    email: "maria.gonzalez@kinetik.demo",
    firstName: "Maria",
    lastName: "Gonzalez",
    injuryType: "Achilles Tendon Rupture",
    sport: "Basketball",
    sportGoal: "Return to recreational league play",
    recoveryPhase: "IN_CLINIC_PT",
    painScore: 5,
    confidenceScore: 5,
    moodNote: "Been busy with work, missed a few sessions this week",
    sessionDayOffsets: [6, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27],
    adherenceScore: 40,
    alerts: [
      {
        type: "MISSED_SESSIONS",
        severity: "WARNING",
        message: "No completed sessions in 6 days.",
      },
    ],
  },
  {
    email: "chris.patel@kinetik.demo",
    firstName: "Chris",
    lastName: "Patel",
    injuryType: "Meniscus Tear",
    sport: "Track & Field",
    sportGoal: "Return to competitive sprinting",
    recoveryPhase: "MAINTENANCE",
    painScore: 1,
    confidenceScore: 9,
    moodNote: "Feeling like myself again, hit full sprint pace today",
    sessionDayOffsets: Array.from({ length: 28 }, (_, i) => i),
    adherenceScore: 93,
    alerts: [
      {
        type: "READINESS_MILESTONE",
        severity: "INFO",
        message: "Readiness score crossed 85 — approaching return-to-sport clearance.",
      },
    ],
  },
];

async function seedReadiness(patientId: string, adherenceScore: number) {
  const existingScore = await prisma.readinessScore.findFirst({ where: { patientId } });
  if (existingScore) return;

  const checkIns = await prisma.dailyCheckIn.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
    take: 14,
  });
  const avgPain = checkIns.reduce((s, c) => s + c.painScore, 0) / checkIns.length;
  const avgConf = checkIns.reduce((s, c) => s + c.confidenceScore, 0) / checkIns.length;
  const physicalScore = Math.max(0, Math.min(100, (10 - avgPain) * 10));
  const psychologicalScore = avgConf * 10;
  const functionalScore = physicalScore * 0.7;
  const overallScore =
    physicalScore * 0.3 + psychologicalScore * 0.25 + adherenceScore * 0.25 + functionalScore * 0.2;

  await prisma.readinessScore.create({
    data: {
      patientId,
      overallScore,
      physicalScore,
      psychologicalScore,
      adherenceScore,
      functionalScore,
      recommendation:
        overallScore >= 80
          ? "Cleared for full return-to-sport progression. Continue monitoring."
          : overallScore >= 60
            ? "Continue building strength and confidence. Light activity progression is appropriate."
            : "Focus on adherence and pain management. Return-to-sport is not yet recommended.",
    },
  });
}

async function seed() {
  console.log("Seeding additional demo patients...");

  const clinic = await prisma.clinic.findUniqueOrThrow({ where: { id: "demo-clinic" } });
  const clinicianUser = await prisma.user.findUniqueOrThrow({
    where: { email: "dr.jellin@kinetik.demo" },
    include: { clinicianProfile: true },
  });
  const clinicianProfileId = clinicianUser.clinicianProfile!.id;

  const password = await bcrypt.hash("patient123", 12);

  for (const spec of patients) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: {
        email: spec.email,
        passwordHash: password,
        firstName: spec.firstName,
        lastName: spec.lastName,
        role: "PATIENT",
        clinicId: clinic.id,
        patientProfile: {
          create: {
            clinicianId: clinicianProfileId,
            clinicId: clinic.id,
            injuryType: spec.injuryType,
            sport: spec.sport,
            sportGoal: spec.sportGoal,
            comorbidities: [],
            recoveryPhase: spec.recoveryPhase,
            clinicianCodeUsed: "KINETIK-DEMO",
          },
        },
      },
      include: { patientProfile: true },
    });
    const patientId = user.patientProfile!.id;

    let program = await prisma.assignedProgram.findFirst({
      where: { patientId, isActive: true },
      include: { exercises: true },
    });
    if (!program) {
      program = await prisma.assignedProgram.create({
        data: {
          patientId,
          name: `${spec.injuryType} Recovery Program`,
          isActive: true,
          frequency: "daily",
          exercises: {
            create: EXERCISE_IDS.map((exerciseId, i) => ({
              exerciseId,
              sets: 3,
              reps: i === 2 ? 1 : 10,
              holdSeconds: i === 0 ? 5 : undefined,
              orderIndex: i,
            })),
          },
        },
        include: { exercises: true },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyCheckIn.upsert({
      where: { patientId_date: { patientId, date: today } },
      create: {
        patientId,
        date: today,
        painScore: spec.painScore,
        confidenceScore: spec.confidenceScore,
        moodNote: spec.moodNote,
      },
      update: {},
    });

    const existingSessions = await prisma.exerciseSession.count({ where: { patientId } });
    if (existingSessions === 0) {
      for (const dayOffset of spec.sessionDayOffsets) {
        const completedAt = new Date();
        completedAt.setDate(completedAt.getDate() - dayOffset);
        for (const pe of program.exercises) {
          await prisma.exerciseSession.create({
            data: {
              patientId,
              programExerciseId: pe.id,
              completedAt,
              setsCompleted: pe.sets,
              repsCompleted: pe.reps,
              formScore: 70 + Math.random() * 25,
            },
          });
        }
      }
    }

    await seedReadiness(patientId, spec.adherenceScore);

    const existingAlerts = await prisma.alert.count({ where: { patientId } });
    if (existingAlerts === 0) {
      for (const alert of spec.alerts) {
        await prisma.alert.create({
          data: {
            patientId,
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
          },
        });
      }
    }

    console.log(`  ✓ ${spec.firstName} ${spec.lastName} (${spec.email})`);
  }

  console.log("\n✅ Additional patients seeded!\n");
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
