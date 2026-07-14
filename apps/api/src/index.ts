import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { authRoutes } from "./routes/auth.js";
import { patientRoutes } from "./routes/patient.js";
import { clinicianRoutes } from "./routes/clinician.js";
import { requireAuth } from "./plugins/auth.js";
import "./plugins/auth.js";

const PORT = Number(process.env.PORT) || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "kinetik-dev-secret-change-in-production";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(jwt, { secret: JWT_SECRET });

  app.decorate("authenticate", requireAuth);

  app.get("/health", async () => ({ status: "ok", service: "kinetik-api" }));

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(patientRoutes, { prefix: "/patient" });
  await app.register(clinicianRoutes, { prefix: "/clinician" });

  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`Kinetik API running on http://localhost:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
