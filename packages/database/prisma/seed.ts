import bcrypt from "bcryptjs";
import { prisma } from "@kinetik/database";

// Readiness is computed via the API service after seed — inline calc for demo data
async function seedReadiness(patientId: string) {
  const checkIns = await prisma.dailyCheckIn.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
    take: 14,
  });
  const avgPain = checkIns.reduce((s, c) => s + c.painScore, 0) / checkIns.length;
  const avgConf = checkIns.reduce((s, c) => s + c.confidenceScore, 0) / checkIns.length;
  const physicalScore = Math.max(0, Math.min(100, (10 - avgPain) * 10));
  const psychologicalScore = avgConf * 10;
  const adherenceScore = 72;
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
        overallScore >= 60
          ? "Continue building strength and confidence. Light activity progression is appropriate."
          : "Focus on adherence and pain management. Return-to-sport is not yet recommended.",
    },
  });
}

async function seed() {
  console.log("Seeding Kinetik database...");

  const clinic = await prisma.clinic.upsert({
    where: { id: "demo-clinic" },
    update: {},
    create: {
      id: "demo-clinic",
      name: "Move2Thrive Sports Rehab",
      address: "Berkeley, CA",
    },
  });

  const clinicianPassword = await bcrypt.hash("clinician123", 12);
  const clinicianUser = await prisma.user.upsert({
    where: { email: "dr.jellin@kinetik.demo" },
    update: {},
    create: {
      email: "dr.jellin@kinetik.demo",
      passwordHash: clinicianPassword,
      firstName: "Justin",
      lastName: "Jellin",
      role: "CLINICIAN",
      clinicId: clinic.id,
      clinicianProfile: {
        create: {
          licenseNumber: "PT-CA-12345",
          specialty: "Sports Medicine",
          onboardingCode: "KINETIK-DEMO",
        },
      },
    },
    include: { clinicianProfile: true },
  });

  const exercises = await Promise.all([
    prisma.exercise.upsert({
      where: { id: "ex-quad-set" },
      update: {},
      create: {
        id: "ex-quad-set",
        name: "Quad Sets",
        description: "Tighten thigh muscle, press knee down. Hold and release.",
        instructions: "Sit with leg extended. Tighten quad, hold 5 seconds, release.",
        bodyRegion: "Knee",
        difficulty: 1,
        isGlobal: true,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-heel-slide" },
      update: {},
      create: {
        id: "ex-heel-slide",
        name: "Heel Slides",
        description: "Slide heel toward buttocks to improve knee flexion range.",
        instructions: "Lie on back, slide heel toward buttocks, hold 2 seconds, return.",
        bodyRegion: "Knee",
        difficulty: 2,
        isGlobal: true,
      },
    }),
    prisma.exercise.upsert({
      where: { id: "ex-single-leg-stand" },
      update: {},
      create: {
        id: "ex-single-leg-stand",
        name: "Single Leg Stand",
        description: "Balance on injured leg to build proprioception and confidence.",
        instructions: "Stand on one leg, maintain balance for 30 seconds. Use wall for support if needed.",
        bodyRegion: "Knee",
        difficulty: 3,
        isGlobal: true,
      },
    }),
  ]);

  const patientPassword = await bcrypt.hash("patient123", 12);
  const patientUser = await prisma.user.upsert({
    where: { email: "sue.smith@kinetik.demo" },
    update: {},
    create: {
      email: "sue.smith@kinetik.demo",
      passwordHash: patientPassword,
      firstName: "Sue",
      lastName: "Smith",
      role: "PATIENT",
      clinicId: clinic.id,
      patientProfile: {
        create: {
          clinicianId: clinicianUser.clinicianProfile!.id,
          clinicId: clinic.id,
          injuryType: "ACL Reconstruction",
          sport: "Soccer",
          sportGoal: "Return to competitive soccer without hesitation",
          comorbidities: [],
          recoveryPhase: "RETURN_TO_SPORT",
          clinicianCodeUsed: "KINETIK-DEMO",
        },
      },
    },
    include: { patientProfile: true },
  });

  const program = await prisma.assignedProgram.create({
    data: {
      patientId: patientUser.patientProfile!.id,
      name: "ACL Return-to-Sport Phase 2",
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyCheckIn.upsert({
    where: {
      patientId_date: { patientId: patientUser.patientProfile!.id, date: today },
    },
    create: {
      patientId: patientUser.patientProfile!.id,
      date: today,
      painScore: 3,
      confidenceScore: 6,
      moodNote: "Feeling better but still hesitant about cutting movements",
    },
    update: {},
  });

  const existingScore = await prisma.readinessScore.findFirst({
    where: { patientId: patientUser.patientProfile!.id },
  });
  if (!existingScore) {
    await seedReadiness(patientUser.patientProfile!.id);
  }

  console.log("\n✅ Seed complete!\n");
  console.log("Clinician login: dr.jellin@kinetik.demo / clinician123");
  console.log("Clinician code:  KINETIK-DEMO");
  console.log("Patient login:   sue.smith@kinetik.demo / patient123");
  console.log(`Program ID:      ${program.id}\n`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
