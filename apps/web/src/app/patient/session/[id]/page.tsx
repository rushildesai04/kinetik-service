"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography, IconButton, Button, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckIcon from "@mui/icons-material/Check";
import BluetoothIcon from "@mui/icons-material/Bluetooth";
import { api, getStoredToken } from "@/lib/api";

interface ExerciseInfo {
  name: string;
  description: string;
  sets: number;
  reps: number;
  programExerciseId: string;
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const programExerciseId = params.id as string;
  const [exercise, setExercise] = useState<ExerciseInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reps, setReps] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [formScore, setFormScore] = useState(75);
  const [feedback, setFeedback] = useState("Align your movement and press play to begin.");
  const [active, setActive] = useState(false);
  const [completing, setCompleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<{ todaysProgram: { exercises: ExerciseInfo[] } }>("/patient/dashboard", { token })
      .then((d) => {
        const ex = d.todaysProgram?.exercises.find((e) => e.programExerciseId === programExerciseId);
        if (ex) setExercise(ex);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [router, programExerciseId]);

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active]);

  async function completeSession() {
    const token = getStoredToken();
    if (!token || !exercise) return;
    setCompleting(true);
    try {
      await api("/patient/sessions", {
        method: "POST",
        token,
        body: JSON.stringify({
          programExerciseId,
          setsCompleted: exercise.sets,
          repsCompleted: Math.max(reps, exercise.reps),
          formScore,
        }),
      });
      router.push("/patient");
    } catch {
      setFeedback("Failed to save session — try again.");
      setCompleting(false);
    }
  }

  function handleRep() {
    if (!active) {
      setFeedback("Press play to start tracking before counting reps.");
      return;
    }
    const targetReps = exercise ? exercise.sets * exercise.reps : 0;
    setReps((r) => {
      const next = Math.min(r + 1, targetReps);
      if (next >= targetReps) {
        setFeedback("Target reps reached — tap ✓ to complete session.");
        setActive(false);
      } else {
        setFeedback(next % 5 === 0 ? "Great form! Keep that tempo." : "Good rep — control the movement.");
      }
      return next;
    });
    setFormScore((f) => Math.min(f + 1, 98));
  }

  function resetSession() {
    setReps(0);
    setSeconds(0);
    setFormScore(75);
    setActive(false);
    setFeedback("Session reset — press play when ready.");
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (notFound) {
    return (
      <Box minHeight="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bgcolor="#f6f8fb" px={3}>
        <Alert severity="warning" sx={{ mb: 3, maxWidth: 400 }}>
          Exercise not found in today&apos;s program.
        </Alert>
        <Button variant="contained" onClick={() => router.push("/patient/plan")}>
          Back to Plan
        </Button>
      </Box>
    );
  }

  if (!exercise) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f6f8fb">
        <Typography color="text.secondary">Loading session...</Typography>
      </Box>
    );
  }

  const targetReps = exercise.sets * exercise.reps;
  const formLabel = formScore >= 90 ? "PERFECT FORM" : formScore >= 75 ? "GOOD FORM" : "ADJUST FORM";

  return (
    <Box
      minHeight="100vh"
      sx={{
        background: "radial-gradient(ellipse at center, #eef9f6 0%, #f6f8fb 70%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
        <IconButton onClick={() => router.push("/patient")} sx={{ color: "#94a3b8" }}>
          <CloseIcon />
        </IconButton>
        <Box textAlign="center" flex={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            {exercise.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {exercise.description}
          </Typography>
        </Box>
        <BluetoothIcon sx={{ color: active ? "#00967d" : "#94a3b8", fontSize: 20 }} titleAccess="Sensor connection simulated" />
      </Box>

      <Box flex={1} display="flex" alignItems="center" justifyContent="center" position="relative" px={3}>
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: "rgba(15,23,42,0.03)",
            border: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <Typography variant="caption" color="#00967d" fontWeight={600}>
            {formLabel}
          </Typography>
        </Box>

        <Box
          onClick={handleRep}
          sx={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: active
              ? "radial-gradient(circle, rgba(0,229,199,0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(0,229,199,0.08) 0%, transparent 70%)",
            border: `1px solid ${active ? "rgba(0,229,199,0.35)" : "rgba(0,229,199,0.15)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: active ? "0 0 60px rgba(0,229,199,0.2)" : "0 0 60px rgba(0,229,199,0.1)",
            cursor: active ? "pointer" : "default",
            transition: "all 0.3s",
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "#00e5c7",
                boxShadow: "0 0 12px rgba(0,229,199,0.8)",
                top: `${20 + i * 15}%`,
                left: `${30 + (i % 2) * 40}%`,
                animation: active ? "pulse-glow 2s ease-in-out infinite" : "none",
                animationDelay: `${i * 0.2}s`,
                opacity: active ? 1 : 0.4,
              }}
            />
          ))}
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {active ? "Tap to count rep" : "Movement tracking"}
            <br />
            <Box component="span" sx={{ color: "#00967d", fontWeight: 600 }}>
              {active ? `${reps}/${targetReps} reps` : "Press play to start"}
            </Box>
          </Typography>
        </Box>
      </Box>

      <Box px={3} pb={2}>
        <Box display="flex" justifyContent="space-around" mb={2}>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">REPS</Typography>
            <Typography variant="h6" fontWeight={700}>{reps}/{targetReps}</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">TIME</Typography>
            <Typography variant="h6" fontWeight={700}>{formatTime(seconds)}</Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" color="text.secondary">FORM</Typography>
            <Typography variant="h6" fontWeight={700} color="#00967d">{formScore}%</Typography>
          </Box>
        </Box>

        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.25)",
            mb: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="#10b981" fontWeight={500}>
            ✓ {feedback}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="center" alignItems="center" gap={3} pb={4}>
          <IconButton onClick={resetSession} sx={{ width: 48, height: 48, bgcolor: "rgba(15,23,42,0.05)", color: "#64748b" }}>
            <ReplayIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              setActive((a) => !a);
              setFeedback(active ? "Session paused." : "Session active — tap the circle to count reps.");
            }}
            sx={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, #00e5c7, #6366f1)",
              color: "#060a12",
              boxShadow: "0 0 40px rgba(0,229,199,0.4)",
              animation: active ? "none" : "pulse-glow 2s ease-in-out infinite",
            }}
          >
            {active ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayArrowIcon sx={{ fontSize: 32 }} />}
          </IconButton>
          <IconButton
            onClick={completeSession}
            disabled={completing || reps === 0}
            sx={{
              width: 48,
              height: 48,
              bgcolor: "rgba(15,23,42,0.05)",
              color: reps > 0 ? "#10b981" : "#cbd5e1",
            }}
          >
            <CheckIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
