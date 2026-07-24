"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Slider, Alert, Snackbar } from "@mui/material";
import { api, getStoredToken } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";

const KOOS_ITEMS = [
  { key: "pain", label: "Knee pain with daily activity" },
  { key: "symptoms", label: "Swelling / stiffness symptoms" },
  { key: "adl", label: "Function in daily living" },
  { key: "sport", label: "Function in sport / recreation" },
  { key: "qol", label: "Knee-related quality of life" },
];

export default function SurveysPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({
    pain: 7,
    symptoms: 7,
    adl: 6,
    sport: 5,
    qol: 6,
  });
  const [history, setHistory] = useState<Array<{ surveyType: string; totalScore: number; completedAt: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<typeof history>("/patient/surveys", { token }).then(setHistory);
  }, [router]);

  async function submit() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      await api("/patient/surveys", {
        method: "POST",
        token,
        body: JSON.stringify({ surveyType: "KOOS", scores }),
      });
      setSnack("KOOS survey saved — readiness recalculated");
      const refreshed = await api<typeof history>("/patient/surveys", { token });
      setHistory(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save survey");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientShell title="Outcome Surveys" subtitle="KOOS / IKDC validated instruments">
      <Typography variant="body2" color="text.secondary" mb={3}>
        Quantitative monitoring with clinician-validated outcome scores. Higher = better function (0–10 per domain).
      </Typography>

      <GlassCard sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>
          KOOS short form
        </Typography>
        {KOOS_ITEMS.map((item) => (
          <Box key={item.key} mb={2.5}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2">{item.label}</Typography>
              <Typography variant="body2" fontWeight={700}>
                {scores[item.key]}/10
              </Typography>
            </Box>
            <Slider
              value={scores[item.key]}
              min={0}
              max={10}
              step={1}
              onChange={(_, v) => setScores((s) => ({ ...s, [item.key]: v as number }))}
            />
          </Box>
        ))}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Button variant="contained" fullWidth onClick={submit} disabled={loading}>
          {loading ? "Saving..." : "Submit KOOS survey"}
        </Button>
      </GlassCard>

      <GlassCard sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>
          History
        </Typography>
        {history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No surveys completed yet.
          </Typography>
        ) : (
          history.map((s, i) => (
            <Box key={i} display="flex" justifyContent="space-between" py={1} borderBottom="1px solid rgba(0,0,0,0.06)">
              <Typography variant="body2">
                {s.surveyType} · {new Date(s.completedAt).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" fontWeight={700} color="primary">
                {Math.round(s.totalScore)}
              </Typography>
            </Box>
          ))
        )}
      </GlassCard>
      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack("")} message={snack} />
    </PatientShell>
  );
}
