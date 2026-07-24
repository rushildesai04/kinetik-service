import { prisma } from "@kinetik/database";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function monthBounds(ref = new Date()) {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

/** Ensure patient is enrolled in RTM when they start generating recoverable data. */
export async function ensureRtmEnrollment(patientId: string) {
  return prisma.rtmEnrollment.upsert({
    where: { patientId },
    create: { patientId, status: "ACTIVE" },
    update: {},
  });
}

/** Log a day of RTM-qualifying data (session, check-in, or sensor). */
export async function logRtmDay(
  patientId: string,
  opts: { minutes?: number; source?: string; date?: Date } = {}
) {
  const enrollment = await ensureRtmEnrollment(patientId);
  if (enrollment.status !== "ACTIVE") return enrollment;

  const date = startOfDay(opts.date ?? new Date());
  const minutes = opts.minutes ?? 0;

  await prisma.rtmDayLog.upsert({
    where: {
      enrollmentId_date: { enrollmentId: enrollment.id, date },
    },
    create: {
      enrollmentId: enrollment.id,
      date,
      hasData: true,
      minutes,
      source: opts.source ?? "session",
    },
    update: {
      hasData: true,
      minutes: { increment: minutes },
      source: opts.source ?? "session",
    },
  });

  return enrollment;
}

export async function logRtmCommunication(
  patientId: string,
  minutes: number,
  note?: string
) {
  const enrollment = await ensureRtmEnrollment(patientId);
  await prisma.rtmCommunication.create({
    data: {
      enrollmentId: enrollment.id,
      minutes,
      note,
    },
  });
  await logRtmDay(patientId, { minutes, source: "clinician" });
  return enrollment;
}

/**
 * Build a CMS-style RTM claim package for the current (or given) calendar month.
 * CPT mapping (simplified for demo):
 *  - 98975: setup / education (always if enrolled)
 *  - 98977: device supply / data transmission with ≥16 days of data
 *  - 98980: first 20 min interactive communication
 *  - 98981: each additional 20 min
 */
export async function buildRtmClaim(patientId: string, ref = new Date()) {
  const enrollment = await prisma.rtmEnrollment.findUnique({
    where: { patientId },
    include: {
      patient: { include: { user: true } },
      dayLogs: true,
      communications: true,
    },
  });
  if (!enrollment) return null;

  const { start, end } = monthBounds(ref);
  const days = enrollment.dayLogs.filter(
    (d) => d.date >= start && d.date <= end && d.hasData
  );
  const comms = enrollment.communications.filter(
    (c) => c.occurredAt >= start && c.occurredAt <= end
  );

  const dataDays = days.length;
  const totalMinutes =
    days.reduce((s, d) => s + d.minutes, 0) +
    comms.reduce((s, c) => s + c.minutes, 0);

  const cptCodes: string[] = ["98975"];
  if (dataDays >= 16) cptCodes.push("98977");
  if (totalMinutes >= 20) cptCodes.push("98980");
  if (totalMinutes >= 40) cptCodes.push("98981");

  const payload = {
    patientName: `${enrollment.patient.user.firstName} ${enrollment.patient.user.lastName}`,
    patientId: enrollment.patientId,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    dataDays,
    totalMinutes,
    cptCodes,
    qualifies98977: dataDays >= 16,
    communications: comms.map((c) => ({
      minutes: c.minutes,
      note: c.note,
      occurredAt: c.occurredAt.toISOString(),
    })),
    generatedAt: new Date().toISOString(),
    billingModel: "RTM remote therapeutic monitoring",
  };

  const exportRow = await prisma.rtmClaimExport.create({
    data: {
      enrollmentId: enrollment.id,
      periodStart: start,
      periodEnd: end,
      cptCodes,
      dataDays,
      totalMinutes,
      payload,
    },
  });

  return { ...payload, exportId: exportRow.id };
}

export async function getClinicRtmSummary(clinicianId: string) {
  const patients = await prisma.patientProfile.findMany({
    where: { clinicianId },
    include: {
      user: true,
      rtmEnrollment: {
        include: {
          dayLogs: true,
          communications: true,
          claimExports: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const { start, end } = monthBounds();

  return patients.map((p) => {
    const enr = p.rtmEnrollment;
    const days = enr?.dayLogs.filter((d) => d.date >= start && d.date <= end && d.hasData) ?? [];
    const minutes =
      (enr?.dayLogs
        .filter((d) => d.date >= start && d.date <= end)
        .reduce((s, d) => s + d.minutes, 0) ?? 0) +
      (enr?.communications
        .filter((c) => c.occurredAt >= start && c.occurredAt <= end)
        .reduce((s, c) => s + c.minutes, 0) ?? 0);

    return {
      patientId: p.id,
      name: `${p.user.firstName} ${p.user.lastName}`,
      injuryType: p.injuryType,
      enrolled: !!enr && enr.status === "ACTIVE",
      dataDays: days.length,
      totalMinutes: minutes,
      qualifies98977: days.length >= 16,
      lastClaimAt: enr?.claimExports[0]?.createdAt?.toISOString() ?? null,
    };
  });
}
