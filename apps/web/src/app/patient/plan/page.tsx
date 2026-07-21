"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, LinearProgress, Chip, Grid, Alert } from "@mui/material";
import { ExerciseCard } from "@kinetik/ui";
import { api, getStoredToken } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";
import { ProviderNote } from "@/components/ProviderNote";

interface PlanData {
  injuryType: string;
  sport?: string;
  recoveryPhase: string;
  clinician: { name: string; specialty?: string } | null;
  providerNote: string;
  programProgress: { currentWeek: number; totalWeeks: number; percentComplete: number } | null;
  todaysProgram: {
    programName: string;
    exercises: Array<{
      id: string;
      programExerciseId: string;
      name: string;
      description: string;
      bodyRegion: string;
      sets: number;
      reps: number;
      holdSeconds?: number;
    }>;
    completedToday: string[];
  } | null;
}

export default function PlanPage() {
  const router = useRouter();
  const [data, setData] = useState<PlanData | null>(null);
  const [error, setError] = useState("");
  const [logging, setLogging] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<PlanData>("/patient/dashboard", { token })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load plan"));
  }, [router]);

  async function logSession(programExerciseId: string, sets: number, reps: number) {
    const token = getStoredToken();
    if (!token) return;
    setLogging(programExerciseId);
    try {
      await api("/patient/sessions", {
        method: "POST",
        token,
        body: JSON.stringify({ programExerciseId, setsCompleted: sets, repsCompleted: reps }),
      });
      const refreshed = await api<PlanData>("/patient/dashboard", { token });
      setData(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log session");
    } finally {
      setLogging(null);
    }
  }

  if (error && !data) {
    return (
      <PatientShell title="Your Plan">
        <Alert severity="error">{error}</Alert>
      </PatientShell>
    );
  }

  if (!data) {
    return (
      <PatientShell title="Your Plan">
        <Typography color="text.secondary">Loading plan...</Typography>
      </PatientShell>
    );
  }

  const completedSet = new Set(data.todaysProgram?.completedToday ?? []);
  const progress = data.programProgress;
  const totalExercises = data.todaysProgram?.exercises.length ?? 0;

  return (
    <PatientShell title="Your Plan" subtitle="Care team assigned">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={{ xs: 2, md: 2.5, lg: 3 }}>
        <Grid item xs={12} lg={4}>
          <Box
            className="glass-card"
            sx={{
              borderRadius: "20px",
              p: 3,
              height: "100%",
            }}
          >
            <Typography variant="overline" sx={{ color: "#00967d", fontSize: "0.65rem" }}>
              Your care team
            </Typography>
            <Typography variant="h6" fontWeight={700} mb={0.5}>
              {data.clinician?.name ?? "Assigned Clinician"}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              {data.clinician?.specialty ?? "Sports Medicine"} · Kinetik Recovery Program
            </Typography>

            <GlassCard sx={{ p: 2, bgcolor: "rgba(15,23,42,0.03)", mb: 2 }}>
              <Chip label="Diagnosis" size="small" sx={{ mb: 1, bgcolor: "rgba(0,184,154,0.12)", color: "#00967d" }} />
              <Typography variant="body2" fontWeight={600} mb={2}>
                {data.injuryType}
                {data.sport ? ` · ${data.sport}` : ""}
              </Typography>
              {progress && (
                <>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.secondary">
                      {data.recoveryPhase.replace(/_/g, " ")} Journey
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Week {progress.currentWeek} of {progress.totalWeeks}
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress.percentComplete} sx={{ height: 6, borderRadius: 3 }} />
                </>
              )}
            </GlassCard>

            <ProviderNote
              message={data.providerNote}
              author={data.clinician?.name ?? "Your Clinician"}
              date={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
          </Box>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.1em", mb: 2, display: "block" }}>
            {data.todaysProgram?.programName ?? "Exercise Program"}
          </Typography>

          <Grid container spacing={2}>
            {data.todaysProgram?.exercises.map((ex, i) => {
              const isCompleted = completedSet.has(ex.programExerciseId);
              const progressPct = isCompleted ? 100 : 0;
              return (
                <Grid item xs={12} md={6} key={ex.programExerciseId}>
                  <ExerciseCard
                    name={ex.name}
                    description={ex.description}
                    bodyRegion={ex.bodyRegion}
                    sets={ex.sets}
                    reps={ex.reps}
                    holdSeconds={ex.holdSeconds}
                    phase={`Phase ${i < Math.ceil(totalExercises / 2) ? 1 : 2} · ${i < Math.ceil(totalExercises / 2) ? "Foundation" : "Strength"}`}
                    progress={progressPct}
                    isCompleted={isCompleted}
                    onStart={() => router.push(`/patient/session/${ex.programExerciseId}`)}
                    onComplete={() => logSession(ex.programExerciseId, ex.sets, ex.reps)}
                  />
                  {logging === ex.programExerciseId && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      Logging session...
                    </Typography>
                  )}
                </Grid>
              );
            }) ?? (
              <Grid item xs={12}>
                <GlassCard>
                  <Typography color="text.secondary" variant="body2" mb={2}>
                    No active program assigned yet.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Contact your clinician or complete onboarding with a valid code.
                  </Typography>
                </GlassCard>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </PatientShell>
  );
}
