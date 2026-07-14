import type { FastifyRequest, FastifyReply } from "fastify";

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  clinicId?: string;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}

export function getUser(request: FastifyRequest): JwtPayload {
  return request.user as JwtPayload;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
