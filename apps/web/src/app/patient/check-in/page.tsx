"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography, TextField, Alert } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { PainScoreSlider, ConfidenceScoreSlider } from "@kinetik/ui";
import { api, getStoredToken } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";

export default function CheckInPage() {
  const router = useRouter();
  const [painScore, setPainScore] = useState(3);
  const [confidenceScore, setConfidenceScore] = useState(5);
  const [moodNote, setMoodNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<{ latestCheckIn?: { painScore: number; confidenceScore: number; moodNote?: string; date: string } }>(
      "/patient/dashboard",
      { token }
    ).then((d) => {
      if (d.latestCheckIn) {
        const today = new Date().toDateString();
        const checkInDate = new Date(d.latestCheckIn.date).toDateString();
        if (today === checkInDate) {
          setPainScore(d.latestCheckIn.painScore);
          setConfidenceScore(d.latestCheckIn.confidenceScore);
          setMoodNote(d.latestCheckIn.moodNote ?? "");
          setAlreadyCheckedIn(true);
        }
      }
    });
  }, [router]);

  async function handleSubmit() {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/patient/check-in", {
        method: "POST",
        token,
        body: JSON.stringify({ painScore, confidenceScore, moodNote: moodNote || undefined }),
      });
      router.push("/patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientShell title="Daily Check-In" showNav={false}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/patient")}
        sx={{ mb: 2, color: "text.secondary" }}
      >
        Back
      </Button>

      <Typography variant="body2" color="text.secondary" mb={3}>
        How is your body feeling today? This updates your readiness score and alerts your clinician if needed.
      </Typography>

      {alreadyCheckedIn && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You&apos;ve already checked in today. Update your scores below if anything has changed.
        </Alert>
      )}

      <GlassCard sx={{ p: 3, mb: 2 }}>
        <PainScoreSlider value={painScore} onChange={setPainScore} />
      </GlassCard>

      <GlassCard sx={{ p: 3, mb: 2 }}>
        <ConfidenceScoreSlider value={confidenceScore} onChange={setConfidenceScore} />
      </GlassCard>

      <GlassCard sx={{ p: 3, mb: 3 }}>
        <TextField
          label="How are you feeling? (optional)"
          multiline
          rows={3}
          fullWidth
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
          placeholder="Any concerns about returning to activity? Fear of reinjury?"
        />
      </GlassCard>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button variant="contained" fullWidth size="large" onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : alreadyCheckedIn ? "Update Check-In" : "Complete Check-In"}
      </Button>
    </PatientShell>
  );
}
