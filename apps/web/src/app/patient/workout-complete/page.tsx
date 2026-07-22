"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Typography, TextField, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { PainScoreSlider, DifficultyScoreSlider } from "@kinetik/ui";
import { api, getStoredToken } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";

export default function WorkoutCompletePage() {
  return (
    <Suspense fallback={null}>
      <WorkoutCompleteForm />
    </Suspense>
  );
}

function WorkoutCompleteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextExerciseId = searchParams.get("next");
  const sessionId = searchParams.get("sessionId");
  const [painScore, setPainScore] = useState(2);
  const [difficulty, setDifficulty] = useState(5);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState<"continue" | "finish" | null>(null);
  const [error, setError] = useState("");

  async function submitFeedback() {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return false;
    }
    setError("");
    try {
      await api("/patient/workout-feedback", {
        method: "POST",
        token,
        body: JSON.stringify({
          painScore,
          difficulty,
          comments: comments || undefined,
          exerciseSessionId: sessionId || undefined,
        }),
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
      return false;
    }
  }

  async function handleContinue() {
    setLoading("continue");
    const ok = await submitFeedback();
    setLoading(null);
    if (ok) router.push(`/patient/session/${nextExerciseId}`);
  }

  async function handleFinish() {
    setLoading("finish");
    const ok = await submitFeedback();
    setLoading(null);
    if (ok) router.push("/patient");
  }

  function handleSkip() {
    router.push(nextExerciseId ? `/patient/session/${nextExerciseId}` : "/patient");
  }

  return (
    <PatientShell title="Workout Complete" showNav={false}>
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <CheckCircleIcon sx={{ color: "#10b981", fontSize: 32 }} />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Nice work!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A quick note on how it felt helps your clinician adjust your plan.
          </Typography>
        </Box>
      </Box>

      <GlassCard sx={{ p: 3, mb: 2 }}>
        <PainScoreSlider value={painScore} onChange={setPainScore} label="Pain During Workout" />
      </GlassCard>

      <GlassCard sx={{ p: 3, mb: 2 }}>
        <DifficultyScoreSlider value={difficulty} onChange={setDifficulty} />
      </GlassCard>

      <GlassCard sx={{ p: 3, mb: 3 }}>
        <TextField
          label="Anything else? (optional)"
          multiline
          rows={3}
          fullWidth
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="How did it feel? Anything hurt, feel off, or go especially well?"
        />
      </GlassCard>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {nextExerciseId ? (
        <>
          <Button variant="contained" fullWidth size="large" onClick={handleContinue} disabled={loading !== null}>
            {loading === "continue" ? "Saving..." : "Submit & Continue to Next Exercise"}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            sx={{ mt: 1.5 }}
            onClick={handleFinish}
            disabled={loading !== null}
          >
            {loading === "finish" ? "Saving..." : "Submit & Finish for Today"}
          </Button>
        </>
      ) : (
        <Button variant="contained" fullWidth size="large" onClick={handleFinish} disabled={loading !== null}>
          {loading === "finish" ? "Saving..." : "Submit Feedback"}
        </Button>
      )}
      <Button
        fullWidth
        size="large"
        sx={{ mt: 1, color: "text.secondary" }}
        onClick={handleSkip}
        disabled={loading !== null}
      >
        {nextExerciseId ? "Skip review, next exercise" : "Skip for now"}
      </Button>
    </PatientShell>
  );
}
