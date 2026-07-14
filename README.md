# Kinetik Technologies

**Continuous recovery coaching for athletes between physical therapy sessions.**

Kinetik bridges the gap between clinical discharge ("can walk and climb stairs") and return-to-sport readiness. Built from 30+ customer discovery interviews with athletes, PTs, and sports medicine clinics.

## Problem We Solve

The formal rehab system exits at functional baseline. For competitive and recreational athletes, that's the starting line — not the finish line. After PT ends, athletes face daily decisions about pain, load progression, and readiness with no structured support, no feedback loop, and no one accountable for the outcome.

## Architecture

```
kinetik/
├── apps/
│   ├── api/          Fastify REST API (Node.js)
│   └── web/          Next.js 15 patient + clinician app (React)
├── packages/
│   ├── database/     Prisma ORM + PostgreSQL schema
│   ├── types/        Shared TypeScript contracts
│   └── ui/           Shared MUI component library
```

### Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Monorepo | pnpm + Turborepo | Shared types/UI across API and web |
| Frontend | Next.js 15, React 19, MUI | SSR, mobile-first PWA, clinician desktop |
| Backend | Fastify, Zod | Fast, typed validation at boundaries |
| Database | PostgreSQL, Prisma | Relational health data, audit trails |
| Video | Mux (optional) | HEP exercise video hosting |
| Auth | JWT | Clinician-prescribed patient onboarding |

### Core Domain Models

- **PatientProfile** — injury, sport goal, recovery phase, comorbidities
- **DailyCheckIn** — pain (0–10), confidence (0–10), mood notes
- **AssignedProgram** — clinician-prescribed home exercise program
- **ExerciseSession** — adherence logging with optional form scores
- **ReadinessScore** — composite return-to-sport score (physical, psychological, adherence, functional)
- **Alert** — low-burden clinician notifications (high pain, low adherence, milestones)
- **OutcomeSurvey** — KOOS/IKDC validated orthopedic outcomes

### Key Design Decisions

1. **Two-sided, one codebase** — Patients use mobile-first web; clinicians use dashboard. Role-based routing, shared UI package.

2. **Clinician-prescribed onboarding** — Patients join via PT code (`KINETIK-DEMO`), mirroring the HealthScripts GTM model and ensuring clinical trust.

3. **Low-burden clinician UX** — Alerts surface only actionable signals. No extra documentation burden (Stone Clinic feedback: PTs are stretched; technology must be seamless).

4. **Readiness ≠ time-based clearance** — Composite score weights pain trends, psychological confidence, adherence, and functional outcomes — addressing the "cleared but not ready" gap.

5. **Psychological recovery is first-class** — Confidence score in daily check-in, weighted in readiness calculation. Fear of reinjury is a leading cause of second injury.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET

# Push schema and seed demo data
pnpm db:generate
pnpm db:push
pnpm --filter @kinetik/database seed

# Start development
pnpm dev
```

- **Web app**: http://localhost:3000
- **API**: http://localhost:3001

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Clinician | dr.jellin@kinetik.demo | clinician123 |
| Patient | sue.smith@kinetik.demo | patient123 |
| Onboarding code | `KINETIK-DEMO` | — |

## Application Routes

### Patient
- `/` — Landing page
- `/onboard` — Join with clinician code
- `/patient` — Daily dashboard (program, adherence, readiness)
- `/patient/check-in` — Pain + confidence logging
- `/patient/readiness` — Return-to-sport score breakdown

### Clinician
- `/clinician` — Patient overview + alerts
- `/clinician/patients/[id]` — Individual patient detail

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Sign in |
| POST | `/auth/onboard` | Patient registration with clinician code |
| GET | `/patient/dashboard` | Today's program, adherence, readiness |
| POST | `/patient/check-in` | Daily pain/confidence log |
| POST | `/patient/sessions` | Log exercise completion |
| GET | `/clinician/dashboard` | Patient summaries + alerts |
| GET | `/clinician/patients/:id` | Patient detail |

## Roadmap (Post-MVP)

- [ ] Mux integration for exercise video library
- [ ] EMG/IMU sensor data ingestion pipeline
- [ ] Computer vision form analysis (ReviveMe CV stack)
- [ ] KOOS/IKDC full survey flows
- [ ] EMR integration (WebPT, Athena)
- [ ] RTM billing code export
- [ ] Push notifications (FCM)
- [ ] Peer support community

## Business Context

- **Pricing**: $80/patient/month SaaS + ~$450 hardware kit (Year 1 model)
- **GTM**: HealthScripts prescriber network + clinic pilots (California SOM)
- **Moat**: Workflow integration + longitudinal outcome data + clinical trust

---

Kinetik Technologies · Group 7 · ENGIN 183C · UC Berkeley
