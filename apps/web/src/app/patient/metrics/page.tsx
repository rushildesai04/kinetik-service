"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Grid, Alert, Snackbar } from "@mui/material";
import { ReadinessGauge, StatCard } from "@kinetik/ui";
import { api, getStoredToken } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";
import { RecoveryRadar } from "@/components/RecoveryRadar";

interface ReadinessEntry {
  overallScore: number;
  physicalScore: number;
  psychologicalScore: number;
  adherenceScore: number;
  functionalScore: number;
  recommendation: string;
  calculatedAt: string;
}

interface ReportData {
  generatedAt: string;
  patient: { injuryType: string; sport?: string; recoveryPhase: string };
  summary: {
    adherenceRate: number;
    streak: number;
    sessionsThisWeek: number;
    repsThisWeek: number;
    latestPain?: number;
    latestConfidence?: number;
    readinessScore?: number;
    recommendation?: string;
  };
  readinessTrend: Array<{
    date: string;
    overallScore: number;
    physicalScore: number;
    psychologicalScore: number;
    adherenceScore: number;
    functionalScore: number;
  }>;
}

export default function MetricsPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ReadinessEntry[]>([]);
  const [dashboard, setDashboard] = useState<{ adherenceRate: number; latestCheckIn?: { painScore: number } } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [snack, setSnack] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([
      api<ReadinessEntry[]>("/patient/readiness", { token }),
      api<{ adherenceRate: number; latestCheckIn?: { painScore: number } }>("/patient/dashboard", { token }),
    ])
      .then(([r, d]) => {
        setHistory(r);
        setDashboard(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load metrics"));
  }, [router]);

  async function handleGenerateReport() {
    const token = getStoredToken();
    if (!token) return;
    setGenerating(true);
    try {
      const report = await api<ReportData>("/patient/report", { token });
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kinetik-report-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnack("Report downloaded — share securely with your clinician.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  const latest = history[0];

  const radarMetrics = latest
    ? [
        { label: "Physical", value: latest.physicalScore },
        { label: "Psychological", value: latest.psychologicalScore },
        { label: "Adherence", value: latest.adherenceScore },
        { label: "Functional", value: latest.functionalScore },
        { label: "Consistency", value: dashboard?.adherenceRate ?? 0 },
      ]
    : [];

  return (
    <PatientShell title="Metrics" subtitle="Recovery analytics">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Typography variant="body2" color="text.secondary" mb={3}>
        Your readiness combines pain trends, confidence, adherence, and functional outcomes.
      </Typography>

      {latest ? (
        <Grid container spacing={{ xs: 2, md: 2.5, lg: 3 }}>
          <Grid item xs={12} lg={7}>
            <GlassCard sx={{ p: { xs: 2.5, md: 3 }, height: "100%" }}>
              <ReadinessGauge
                score={latest.overallScore}
                recommendation={latest.recommendation}
                showBreakdown={{
                  physical: latest.physicalScore,
                  psychological: latest.psychologicalScore,
                  adherence: latest.adherenceScore,
                  functional: latest.functionalScore,
                }}
              />
            </GlassCard>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Grid container spacing={2} height="100%">
              <Grid item xs={6}>
                <StatCard title="Pain Today" value={dashboard?.latestCheckIn ? `${dashboard.latestCheckIn.painScore}/10` : "—"} gradient />
              </Grid>
              <Grid item xs={6}>
                <StatCard title="Adherence" value={`${Math.round(dashboard?.adherenceRate ?? 0)}%`} gradient />
              </Grid>
              <Grid item xs={12}>
                <RecoveryRadar
                  metrics={radarMetrics}
                  title="Comprehensive Recovery Profile"
                  subtitle="5-axis snapshot vs your baseline"
                />
              </Grid>
            </Grid>
          </Grid>

          {history.length > 1 && (
            <Grid item xs={12}>
              <GlassCard sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>
                  Readiness Trend ({history.length} entries)
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {history.slice(0, 7).map((entry, i) => (
                    <Box
                      key={i}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        bgcolor: "rgba(15,23,42,0.03)",
                        border: "1px solid rgba(15,23,42,0.08)",
                        textAlign: "center",
                        minWidth: 80,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(entry.calculatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700} color="#00967d">
                        {Math.round(entry.overallScore)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </GlassCard>
            </Grid>
          )}

          <Grid item xs={12}>
            <GlassCard
              sx={{
                p: 3,
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                alignItems: { md: "center" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700} mb={0.5}>
                  Generate Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compile this week&apos;s metrics and share securely with your clinician.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                sx={{ minWidth: { md: 200 }, flexShrink: 0 }}
                onClick={handleGenerateReport}
                disabled={generating}
              >
                {generating ? "Generating..." : "Generate report"}
              </Button>
            </GlassCard>
          </Grid>
        </Grid>
      ) : (
        <GlassCard>
          <Typography color="text.secondary" variant="body2" mb={2}>
            Complete daily check-ins and exercises to build your metrics profile.
          </Typography>
          <Button variant="contained" size="small" onClick={() => router.push("/patient/check-in")}>
            Start daily check-in
          </Button>
        </GlassCard>
      )}

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack("")} message={snack} />
    </PatientShell>
  );
}
