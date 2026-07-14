// ─── Auth ────────────────────────────────────────────────────────────────

export type UserRole = "PATIENT" | "CLINICIAN" | "CLINIC_ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  clinicId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PatientOnboardRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicianCode: string;
  injuryType: string;
  sport?: string;
  sportGoal?: string;
  comorbidities?: string[];
}

// ─── Daily Check-In ────────────────────────────────────────────────────────

export interface DailyCheckInInput {
  painScore: number;
  confidenceScore: number;
  moodNote?: string;
  symptoms?: string[];
}

export interface DailyCheckInResponse extends DailyCheckInInput {
  id: string;
  date: string;
  patientId: string;
}

// ─── Exercise & Programs ───────────────────────────────────────────────────

export interface ExerciseSummary {
  id: string;
  name: string;
  description: string;
  bodyRegion: string;
  videoUrl?: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  orderIndex: number;
}

export interface TodaysProgram {
  programId: string;
  programName: string;
  exercises: ExerciseSummary[];
  completedToday: string[];
  adherenceStreak: number;
}

export interface SessionLogInput {
  programExerciseId: string;
  setsCompleted: number;
  repsCompleted: number;
  painDuring?: number;
  formScore?: number;
  notes?: string;
}

// ─── Readiness ─────────────────────────────────────────────────────────────

export interface ReadinessScoreView {
  overallScore: number;
  physicalScore: number;
  psychologicalScore: number;
  adherenceScore: number;
  functionalScore: number;
  recommendation: string;
  calculatedAt: string;
}

export interface OutcomeSurveyInput {
  surveyType: "KOOS" | "IKDC" | "CUSTOM";
  responses: Record<string, number>;
}

// ─── Clinician Dashboard ───────────────────────────────────────────────────

export interface PatientSummary {
  id: string;
  name: string;
  injuryType: string;
  sport?: string;
  recoveryPhase: string;
  lastCheckIn?: string;
  painScore?: number;
  adherenceRate: number;
  readinessScore?: number;
  unreadAlerts: number;
}

export interface ClinicianAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface PatientDetail extends PatientSummary {
  sportGoal?: string;
  comorbidities: string[];
  checkInHistory: DailyCheckInResponse[];
  readinessHistory: ReadinessScoreView[];
  activeProgram?: TodaysProgram;
}

// ─── KOOS Survey Domains (validated orthopedic outcome) ────────────────────

export const KOOS_DOMAINS = [
  "pain",
  "symptoms",
  "dailyActivities",
  "sportRecreation",
  "qualityOfLife",
] as const;

export type KoosDomain = (typeof KOOS_DOMAINS)[number];

// ─── API Response wrapper ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
