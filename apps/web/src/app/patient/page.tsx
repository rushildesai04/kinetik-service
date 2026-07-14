"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Chip, Grid, Alert } from "@mui/material";
import Link from "next/link";
import BoltIcon from "@mui/icons-material/Bolt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import { AdherenceRing, ReadinessGauge } from "@kinetik/ui";
import { api, getStoredToken, getStoredUser } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { PerformanceBanner } from "@/components/PerformanceBanner";
import { SessionCard } from "@/components/SessionCard";
import { MetricChip } from "@/components/MetricChip";
import { GlassCard } from "@/components/GlassCard";

interface DashboardData {
  recoveryPhase: string;
  injuryType: string;
  sport?: string;
  adherenceRate: number;
  rankText: string;
  providerNote: string;
  todaysProgram: {
    programName: string;
    exercises: Array<{
      programExerciseId: string;
      name: string;
      sets: number;
      reps: number;
    }>;
    completedToday: string[];
    adherenceStreak: number;
  } | null;
  todayStats: {
    repsCompleted: number;
    avgFormScore?: number;
    exercisesCompleted: number;
    exercisesTotal: number;
  };
  readiness: {
    overallScore: number;
    physicalScore: number;
    psychologicalScore: number;
    adherenceScore: number;
    functionalScore: number;
    recommendation: string;
    delta?: number;
  } | null;
  latestCheckIn: { painScore: number; confidenceScore: number; date: string } | null;
}

const affirmations = [
  "Healing isn't linear — every rep teaches your body a new path back to sport.",
  "Confidence is built one session at a time. Trust the process.",
  "Your readiness score reflects real progress, not just time since injury.",
];

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export default function PatientDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const user = getStoredUser();

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<DashboardData>("/patient/dashboard", { token })
      .then(setData)
      .catch((err) => {
        if (err instanceof Error && err.message.includes("401")) {
          router.push("/login");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      });
  }, [router]);

  if (error) {
    return (
      <PatientShell title="Dashboard" showNav>
        <Alert severity="error">{error}</Alert>
      </PatientShell>
    );
  }

  if (!data) {
    return (
      <PatientShell title="Loading..." showNav={false}>
        <Typography color="text.secondary">Loading your recovery...</Typography>
      </PatientShell>
    );
  }

  const hasCheckedInToday = data.latestCheckIn && isToday(data.latestCheckIn.date);
  const completedSet = new Set(data.todaysProgram?.completedToday ?? []);
  const nextExercise = data.todaysProgram?.exercises.find((e) => !completedSet.has(e.programExerciseId));
  const completedCount = data.todayStats.exercisesCompleted;
  const totalExercises = data.todayStats.exercisesTotal;
  const affirmation = affirmations[new Date().getDay() % affirmations.length];
  const sessionProgress =
    totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <PatientShell subtitle="Welcome back" title={user?.firstName ?? "Athlete"}>
      <Grid container spacing={{ xs: 2, md: 2.5, lg: 3 }}>
        <Grid item xs={12} lg={8}>
          <PerformanceBanner
            streak={data.todaysProgram?.adherenceStreak ?? 0}
            adherence={data.adherenceRate}
            readinessGain={data.readiness?.delta}
            rankText={data.rankText}
          />
        </Grid>

        <Grid item xs={12} lg={4}>
          <Box display="flex" flexDirection="column" gap={{ xs: 2, md: 2.5 }} height="100%">
            {!hasCheckedInToday && (
              <GlassCard
                glow
                sx={{
                  p: 2.5,
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, rgba(0,229,199,0.12), rgba(99,102,241,0.08))",
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
                  Daily check-in pending
                </Typography>
                <Typography variant="caption" color="text.secondary" mb={2}>
                  Log pain &amp; confidence to update readiness
                </Typography>
                <Button component={Link} href="/patient/check-in" variant="contained" size="small">
                  Check In
                </Button>
              </GlassCard>
            )}
            <GlassCard sx={{ p: 2.5, flex: hasCheckedInToday ? 1 : undefined }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Chip
                  icon={<WbSunnyOutlinedIcon />}
                  label="Daily affirmation"
                  size="small"
                  sx={{ bgcolor: "rgba(0,229,199,0.12)", color: "#00e5c7", border: "none" }}
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", lineHeight: 1.7 }}>
                &ldquo;{affirmation}&rdquo;
              </Typography>
            </GlassCard>
          </Box>
        </Grid>

        {nextExercise ? (
          <Grid item xs={12} md={8}>
            <SessionCard
              title={nextExercise.name}
              duration={`${nextExercise.sets * 3} min`}
              schedule="Today"
              progress={sessionProgress}
              onStart={() => router.push(`/patient/session/${nextExercise.programExerciseId}`)}
            />
          </Grid>
        ) : totalExercises > 0 ? (
          <Grid item xs={12} md={8}>
            <GlassCard sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="subtitle1" fontWeight={700} color="#10b981" mb={1}>
                Today&apos;s program complete
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Great work — rest up and check in tomorrow.
              </Typography>
            </GlassCard>
          </Grid>
        ) : null}

        <Grid item xs={12} md={nextExercise || totalExercises > 0 ? 4 : 12}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.1em", mb: 1.5, display: "block" }}>
            Today&apos;s Targets
          </Typography>
          <Box display="flex" gap={1.5}>
            <MetricChip
              icon={<MonitorHeartIcon fontSize="small" />}
              label="Sessions"
              value={`${completedCount}/${totalExercises || 3}`}
              color="#22d3ee"
              onClick={() => router.push("/patient/plan")}
            />
            <MetricChip
              icon={<BoltIcon fontSize="small" />}
              label="Reps"
              value={String(data.todayStats.repsCompleted)}
              color="#10b981"
              onClick={() => router.push("/patient/metrics")}
            />
            <MetricChip
              icon={<EmojiEventsIcon fontSize="small" />}
              label="Form"
              value={
                data.todayStats.avgFormScore != null
                  ? `${Math.round(data.todayStats.avgFormScore)}%`
                  : data.readiness
                    ? `${Math.round(data.readiness.functionalScore)}%`
                    : "—"
              }
              color="#f59e0b"
              onClick={() => router.push("/patient/metrics")}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <GlassCard
            sx={{ p: 3, textAlign: "center", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            onClick={() => router.push("/patient/plan")}
          >
            <AdherenceRing
              rate={data.adherenceRate}
              streak={data.todaysProgram?.adherenceStreak}
              size={140}
            />
          </GlassCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={8}>
          <GlassCard
            sx={{ p: { xs: 2.5, md: 3 }, height: "100%", cursor: "pointer" }}
            onClick={() => router.push("/patient/metrics")}
          >
            {data.readiness ? (
              <ReadinessGauge
                score={data.readiness.overallScore}
                recommendation={data.readiness.recommendation}
                showBreakdown={{
                  physical: data.readiness.physicalScore,
                  psychological: data.readiness.psychologicalScore,
                  adherence: data.readiness.adherenceScore,
                  functional: data.readiness.functionalScore,
                }}
              />
            ) : (
              <Box textAlign="center">
                <Typography color="text.secondary" variant="body2" mb={2}>
                  Complete check-ins and exercises to generate your readiness score.
                </Typography>
                <Button component={Link} href="/patient/check-in" variant="outlined" size="small">
                  Start check-in
                </Button>
              </Box>
            )}
          </GlassCard>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip label={data.injuryType} size="small" />
            {data.sport && <Chip label={data.sport} size="small" variant="outlined" />}
            <Chip label={data.recoveryPhase.replace(/_/g, " ")} size="small" color="primary" variant="outlined" />
          </Box>
        </Grid>
      </Grid>
    </PatientShell>
  );
}
