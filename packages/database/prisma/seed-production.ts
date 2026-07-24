import bcrypt from "bcryptjs";
import { prisma } from "@kinetik/database";

/**
 * Seeds production-pitch entities: payer org, clinic SaaS subscription,
 * RTM enrollments, and a sample EHR connection.
 */
async function seedProduction() {
  console.log("Seeding production-pitch demo data...");

  const clinic = await prisma.clinic.findFirst({ where: { id: "demo-clinic" } });
  if (!clinic) {
    console.error("Run main seed first (demo-clinic missing)");
    process.exit(1);
  }

  await prisma.clinicSubscription.upsert({
    where: { clinicId: clinic.id },
    create: {
      clinicId: clinic.id,
      status: "ACTIVE",
      pricePerPatient: 80,
      activeSeats: await prisma.patientProfile.count({ where: { clinicId: clinic.id } }),
      billingEmail: "dr.jellin@kinetik.demo",
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
    },
    update: {
      status: "ACTIVE",
      pricePerPatient: 80,
      activeSeats: await prisma.patientProfile.count({ where: { clinicId: clinic.id } }),
    },
  });

  await prisma.ehrConnection.upsert({
    where: { clinicId_vendor: { clinicId: clinic.id, vendor: "EPIC" } },
    create: {
      clinicId: clinic.id,
      vendor: "EPIC",
      status: "CONNECTED",
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      externalOrgId: "epic-sandbox-m2t",
      metadata: { mode: "sandbox", fhir: true },
    },
    update: { status: "CONNECTED", lastSyncAt: new Date() },
  });

  const patients = await prisma.patientProfile.findMany({ where: { clinicId: clinic.id } });
  for (const p of patients) {
    const enr = await prisma.rtmEnrollment.upsert({
      where: { patientId: p.id },
      create: { patientId: p.id, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });

    // Backfill ~18 data days so 98977 can qualify in demos
    for (let i = 0; i < 18; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      await prisma.rtmDayLog.upsert({
        where: { enrollmentId_date: { enrollmentId: enr.id, date: d } },
        create: {
          enrollmentId: enr.id,
          date: d,
          hasData: true,
          minutes: 8 + (i % 5),
          source: i % 3 === 0 ? "check_in" : "session",
        },
        update: { hasData: true },
      });
    }
  }

  const payerOrg = await prisma.payerOrganization.upsert({
    where: { id: "demo-payer-blueshield" },
    create: {
      id: "demo-payer-blueshield",
      name: "Blue Shield Innovation (Demo)",
      region: "California",
    },
    update: {},
  });

  const hash = await bcrypt.hash("payer123", 12);
  await prisma.user.upsert({
    where: { email: "payer@kinetik.demo" },
    update: {},
    create: {
      email: "payer@kinetik.demo",
      passwordHash: hash,
      firstName: "Avery",
      lastName: "Chen",
      role: "PAYER",
      payerProfile: {
        create: {
          payerOrgId: payerOrg.id,
          title: "Value-Based Care Lead",
        },
      },
    },
  });

  // Give Sue some XP for demo
  const sue = await prisma.user.findUnique({
    where: { email: "sue.smith@kinetik.demo" },
    include: { patientProfile: true },
  });
  if (sue?.patientProfile) {
    await prisma.patientProfile.update({
      where: { id: sue.patientProfile.id },
      data: { xpTotal: 320, level: 3 },
    });
    await prisma.achievement.upsert({
      where: { userId_code: { userId: sue.id, code: "LEVEL_3" } },
      create: {
        userId: sue.id,
        code: "LEVEL_3",
        title: "Building Momentum",
        description: "Reached recovery level 3",
      },
      update: {},
    });
  }

  console.log("\n✅ Production-pitch seed complete!");
  console.log("Payer login: payer@kinetik.demo / payer123");
  console.log(`RTM enrolled patients: ${patients.length}`);
  console.log("Clinic SaaS: $80/patient/month active\n");
}

seedProduction()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
