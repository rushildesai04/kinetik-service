"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography, IconButton, Button, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ReplayIcon from "@mui/icons-material/Replay";
import CheckIcon from "@mui/icons-material/Check";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import { api, getStoredToken } from "@/lib/api";
import type { PoseLandmarker as PoseLandmarkerType } from "@mediapipe/tasks-vision";

interface ExerciseInfo {
  name: string;
  description: string;
  sets: number;
  reps: number;
  programExerciseId: string;
}

type Landmark = { x: number; y: number; z?: number; visibility?: number };
type JointMode = "knee" | "elbow";

const JOINTS: Record<JointMode, { right: [number, number, number]; left: [number, number, number]; down: number; up: number; label: string }> = {
  knee: { right: [24, 26, 28], left: [23, 25, 27], down: 110, up: 160, label: "knee" },
  elbow: { right: [12, 14, 16], left: [11, 13, 15], down: 70, up: 150, label: "elbow" },
};

const VISIBILITY_MIN = 1.8;
const SWITCH_FRAMES = 15;
const LANDMARK_SMOOTH_ALPHA = 0.22;
const MIN_LANDMARK_VISIBILITY = 0.5;
const LANDMARK_DEADZONE = 0.004;
const ANGLE_SMOOTH_FRAMES = 6;

function angleBetween(a: Landmark, b: Landmark, c: Landmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAb = Math.hypot(ab.x, ab.y);
  const magCb = Math.hypot(cb.x, cb.y);
  const cos = Math.min(1, Math.max(-1, dot / (magAb * magCb)));
  return (Math.acos(cos) * 180) / Math.PI;
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

  const [cvEnabled, setCvEnabled] = useState(false);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvStatus, setCvStatus] = useState("");
  const [cvJoint, setCvJoint] = useState<JointMode | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<PoseLandmarkerType | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef<(Landmark | null)[] | null>(null);
  const angleHistoryRef = useRef<number[]>([]);
  const jointRef = useRef<JointMode | null>(null);
  const repStateRef = useRef<"up" | "down">("up");
  const pendingModeRef = useRef<JointMode | null>(null);
  const pendingCountRef = useRef(0);
  const activeRef = useRef(active);
  const streamRef = useRef<MediaStream | null>(null);
  const autoStartedRef = useRef(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

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

  const registerRep = useCallback(
    (targetReps: number) => {
      setReps((r) => {
        const next = r + 1;
        if (next === targetReps) {
          setFeedback("Goal reached! Keep going if you've got more in you, or tap ✓ to finish.");
        } else if (next > targetReps) {
          setFeedback("Bonus rep — nice. Tap ✓ whenever you're ready to finish.");
        } else {
          setFeedback(next % 5 === 0 ? "Great form! Keep that tempo." : "Good rep — control the movement.");
        }
        return next;
      });
      setFormScore((f) => Math.min(f + 1, 98));
    },
    []
  );

  function stopCameraTracking() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    smoothedRef.current = null;
    angleHistoryRef.current = [];
    jointRef.current = null;
    pendingModeRef.current = null;
    pendingCountRef.current = 0;
    setCvJoint(null);
    setCvStatus("");
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function smoothLandmarks(raw: Landmark[]): (Landmark | null)[] {
    if (!smoothedRef.current) {
      smoothedRef.current = raw.map((p) => (p ? { ...p } : null));
      return smoothedRef.current;
    }
    const smoothed = smoothedRef.current;
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i];
      const s = smoothed[i];
      if (!r) continue;
      const vis = r.visibility ?? 1;
      if (!s || vis < MIN_LANDMARK_VISIBILITY) {
        smoothed[i] = s ? { ...s, visibility: vis } : { ...r };
        continue;
      }
      const dx = r.x - s.x;
      const dy = r.y - s.y;
      if (Math.hypot(dx, dy) < LANDMARK_DEADZONE) {
        smoothed[i] = { ...s, visibility: vis };
        continue;
      }
      smoothed[i] = {
        x: s.x + dx * LANDMARK_SMOOTH_ALPHA,
        y: s.y + dy * LANDMARK_SMOOTH_ALPHA,
        z: (s.z ?? 0) + ((r.z ?? 0) - (s.z ?? 0)) * LANDMARK_SMOOTH_ALPHA,
        visibility: vis,
      };
    }
    return smoothed;
  }

  function sumVisibility(landmarks: (Landmark | null)[], ids: readonly number[]) {
    return ids.reduce((s, idx) => s + (landmarks[idx]?.visibility ?? 0), 0);
  }

  function detectJoint(landmarks: (Landmark | null)[]) {
    const kneeVis = Math.max(sumVisibility(landmarks, JOINTS.knee.right), sumVisibility(landmarks, JOINTS.knee.left));
    const elbowVis = Math.max(sumVisibility(landmarks, JOINTS.elbow.right), sumVisibility(landmarks, JOINTS.elbow.left));

    let candidate: JointMode | null = null;
    if (kneeVis >= VISIBILITY_MIN && kneeVis >= elbowVis) candidate = "knee";
    else if (elbowVis >= VISIBILITY_MIN) candidate = "elbow";

    if (!candidate || candidate === jointRef.current) {
      pendingModeRef.current = null;
      pendingCountRef.current = 0;
      if (!candidate && !jointRef.current) setCvStatus("Get your knee or elbow clearly in frame…");
      return;
    }

    if (candidate === pendingModeRef.current) {
      pendingCountRef.current++;
    } else {
      pendingModeRef.current = candidate;
      pendingCountRef.current = 1;
    }

    if (pendingCountRef.current >= SWITCH_FRAMES) {
      jointRef.current = candidate;
      repStateRef.current = "up";
      angleHistoryRef.current = [];
      setCvJoint(candidate);
      setCvStatus(`Tracking your ${JOINTS[candidate].label}`);
      pendingModeRef.current = null;
      pendingCountRef.current = 0;
    }
  }

  function drawSkeleton(landmarks: (Landmark | null)[]) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00e5c7";
    ctx.strokeStyle = "rgba(0,229,199,0.6)";
    ctx.lineWidth = 3;
    const CONNECTIONS: [number, number][] = [
      [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [23, 24],
      [11, 23], [12, 24], [23, 25], [25, 27], [24, 26], [26, 28],
    ];
    for (const [i, j] of CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      if (!p1 || !p2) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
      ctx.stroke();
    }
    for (const idx of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
      const p = landmarks[idx];
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  function processLandmarks(landmarks: (Landmark | null)[], targetReps: number) {
    const joint = jointRef.current;
    if (!joint) return;
    const cfg = JOINTS[joint];
    const rightVis = sumVisibility(landmarks, cfg.right);
    const leftVis = sumVisibility(landmarks, cfg.left);
    const [i1, i2, i3] = rightVis >= leftVis ? cfg.right : cfg.left;
    const p1 = landmarks[i1];
    const p2 = landmarks[i2];
    const p3 = landmarks[i3];
    if (!p1 || !p2 || !p3) return;

    const raw = angleBetween(p1, p2, p3);
    angleHistoryRef.current.push(raw);
    if (angleHistoryRef.current.length > ANGLE_SMOOTH_FRAMES) angleHistoryRef.current.shift();
    const angle = angleHistoryRef.current.reduce((s, v) => s + v, 0) / angleHistoryRef.current.length;

    if (repStateRef.current === "up" && angle < cfg.down) {
      repStateRef.current = "down";
    } else if (repStateRef.current === "down" && angle > cfg.up) {
      repStateRef.current = "up";
      if (activeRef.current) registerRep(targetReps);
    }
  }

  async function startCameraTracking(targetReps: number) {
    setCvLoading(true);
    setCvStatus("Loading pose model…");
    try {
      const { PoseLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      if (!poseLandmarkerRef.current) {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      await video.play();
      if (canvasRef.current) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
      }

      setCvEnabled(true);
      setCvStatus("Get your knee or elbow clearly in frame…");
      if (!activeRef.current) {
        setActive(true);
        setFeedback("Camera tracking on — bend and straighten to count reps automatically.");
      }

      const loop = () => {
        const landmarker = poseLandmarkerRef.current;
        const v = videoRef.current;
        if (landmarker && v && v.readyState >= 2) {
          const result = landmarker.detectForVideo(v, performance.now());
          if (result.landmarks && result.landmarks[0]) {
            const smoothed = smoothLandmarks(result.landmarks[0] as Landmark[]);
            drawSkeleton(smoothed);
            detectJoint(smoothed);
            processLandmarks(smoothed, targetReps);
          } else {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (err) {
      setCvStatus(err instanceof Error ? `Camera error: ${err.message}` : "Camera error");
      setCvEnabled(false);
    } finally {
      setCvLoading(false);
    }
  }

  function toggleCameraTracking() {
    const targetReps = exercise ? exercise.sets * exercise.reps : 0;
    if (cvEnabled) {
      stopCameraTracking();
      setCvEnabled(false);
    } else {
      startCameraTracking(targetReps);
    }
  }

  useEffect(() => {
    return () => {
      stopCameraTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (exercise && !autoStartedRef.current) {
      autoStartedRef.current = true;
      startCameraTracking(exercise.sets * exercise.reps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

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
          durationSeconds: seconds,
          formScore,
        }),
      });
      router.push("/patient");
    } catch {
      setFeedback("Failed to save session — try again.");
      setCompleting(false);
    }
  }

  function handleTap() {
    if (!active) {
      setFeedback("Press play to start tracking before counting reps.");
      return;
    }
    const targetReps = exercise ? exercise.sets * exercise.reps : 0;
    registerRep(targetReps);
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
          <Typography variant="caption" color="text.secondary" display="block">
            {exercise.description}
          </Typography>
          <Typography variant="caption" sx={{ color: "#00967d", fontWeight: 600 }}>
            Goal: {exercise.sets} × {exercise.reps} ({targetReps} reps total)
          </Typography>
        </Box>
        <IconButton
          onClick={toggleCameraTracking}
          disabled={cvLoading}
          title={cvEnabled ? "Turn off camera tracking" : "Track reps automatically with your camera"}
          sx={{ color: cvEnabled ? "#00967d" : "#94a3b8" }}
        >
          {cvEnabled ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Box flex={1} display="flex" alignItems="center" justifyContent="center" position="relative" px={3}>
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 2,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <Typography variant="caption" color="#00967d" fontWeight={600}>
            {formLabel}
          </Typography>
        </Box>

        <Box
          onClick={handleTap}
          sx={{
            width: "100%",
            maxWidth: 420,
            aspectRatio: "1",
            borderRadius: "28px",
            overflow: "hidden",
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
              opacity: cvEnabled ? 1 : 0,
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              transform: "scaleX(-1)",
              opacity: cvEnabled ? 1 : 0,
            }}
          />
          {!cvEnabled &&
            [0, 1, 2, 3, 4].map((i) => (
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
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              ...(cvEnabled && {
                bgcolor: "rgba(255,255,255,0.85)",
                borderRadius: 2,
                px: 1.5,
                py: 0.75,
              }),
            }}
          >
            <Typography variant="caption" color="text.secondary" textAlign="center" component="div">
              {cvEnabled ? cvStatus || "Starting camera…" : active ? "Tap to count rep" : "Press play to start"}
              <br />
              <Box component="span" sx={{ color: "#00967d", fontWeight: 600 }}>
                {reps}/{targetReps} reps
              </Box>
            </Typography>
          </Box>
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
