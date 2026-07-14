import bcrypt from "bcryptjs";
import { prisma } from "@kinetik/database";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { assignDefaultProgram } from "../services/program.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const onboardSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  clinicianCode: z.string().min(1),
  injuryType: z.string().min(1),
  sport: z.string().optional(),
  sportGoal: z.string().optional(),
  comorbidities: z.array(z.string()).optional(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid credentials format" });
    }

    const user = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (!user || !(await bcrypt.compare(body.data.password, user.passwordHash))) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId ?? undefined,
    });

    return {
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          clinicId: user.clinicId ?? undefined,
        },
      },
    };
  });

  app.post("/onboard", async (request, reply) => {
    const body = onboardSchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: body.error.flatten() });
    }

    const clinician = await prisma.clinicianProfile.findUnique({
      where: { onboardingCode: body.data.clinicianCode },
      include: { user: true },
    });

    if (!clinician) {
      return reply.status(404).send({ error: "Invalid clinician code" });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existing) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(body.data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.data.email,
        passwordHash,
        firstName: body.data.firstName,
        lastName: body.data.lastName,
        role: "PATIENT",
        clinicId: clinician.user.clinicId,
        patientProfile: {
          create: {
            clinicianId: clinician.id,
            clinicId: clinician.user.clinicId,
            injuryType: body.data.injuryType,
            sport: body.data.sport,
            sportGoal: body.data.sportGoal,
            comorbidities: body.data.comorbidities ?? [],
            recoveryPhase: "POST_DISCHARGE",
            clinicianCodeUsed: body.data.clinicianCode,
          },
        },
      },
      include: { patientProfile: true },
    });

    if (user.patientProfile) {
      await assignDefaultProgram(user.patientProfile.id, body.data.injuryType);
    }

    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.status(201).send({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });
  });

  app.get("/me", { onRequest: [app.authenticate] }, async (request) => {
    const payload = request.user as { id: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { patientProfile: true, clinicianProfile: true },
    });
    if (!user) return { error: "User not found" };
    return { data: user };
  });
}
