"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Button,
  Grid,
  Snackbar,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BoltIcon from "@mui/icons-material/Bolt";
import SensorsIcon from "@mui/icons-material/Sensors";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { api, getStoredToken } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";

interface Gamification {
  xpTotal: number;
  level: number;
  nextLevelXp: number;
  progressPct: number;
  achievements: Array<{ code: string; title: string; description: string; earnedAt: string }>;
  recentXp: Array<{ amount: number; reason: string; createdAt: string }>;
}

export default function ProgressPage() {
  const router = useRouter();
  const [data, setData] = useState<Gamification | null>(null);
  const [devices, setDevices] = useState<Array<{ id: string; type: string; label?: string; serialNumber: string; status: string }>>([]);
  const [snack, setSnack] = useState("");
  const [pairing, setPairing] = useState(false);

  function load() {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([
      api<Gamification>("/patient/gamification", { token }),
      api<typeof devices>("/patient/devices", { token }),
    ]).then(([g, d]) => {
      setData(g);
      setDevices(d);
    });
  }

  useEffect(() => {
    load();
  }, [router]);

  async function pairDevice(type: "EMG_BAND" | "IMU" | "COMBINED") {
    const token = getStoredToken();
    if (!token) return;
    setPairing(true);
    try {
      await api("/patient/devices/pair", {
        method: "POST",
        token,
        body: JSON.stringify({ type, label: `Kinetik ${type.replace(/_/g, " ")}` }),
      });
      setSnack("Device paired — EMG/IMU calibration session recorded");
      load();
    } catch (e) {
      setSnack(e instanceof Error ? e.message : "Pairing failed");
    } finally {
      setPairing(false);
    }
  }

  if (!data) {
    return (
      <PatientShell title="Progress">
        <Typography color="text.secondary">Loading gamification...</Typography>
      </PatientShell>
    );
  }

  return (
    <PatientShell title="Progress" subtitle="Gamified recovery">
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <GlassCard sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="overline" color="text.secondary">
              Recovery Level
            </Typography>
            <Typography variant="h2" fontWeight={800} color="primary">
              {data.level}
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
              <BoltIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                {data.xpTotal} XP
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={data.progressPct} sx={{ height: 8, borderRadius: 4, mb: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {data.progressPct}% to level {data.level + 1} ({data.nextLevelXp} XP)
            </Typography>
          </GlassCard>
        </Grid>

        <Grid item xs={12} md={7}>
          <GlassCard sx={{ p: 3, height: "100%" }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <EmojiEventsIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                Achievements
              </Typography>
            </Box>
            {data.achievements.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Complete check-ins and sessions to unlock badges.
              </Typography>
            ) : (
              <Box display="flex" flexWrap="wrap" gap={1}>
                {data.achievements.map((a) => (
                  <Chip
                    key={a.code}
                    icon={<EmojiEventsIcon />}
                    label={a.title}
                    color="primary"
                    variant="outlined"
                    title={a.description}
                  />
                ))}
              </Box>
            )}
            <Typography variant="subtitle2" fontWeight={700} mt={3} mb={1}>
              Recent XP
            </Typography>
            {data.recentXp.map((e, i) => (
              <Box key={i} display="flex" justifyContent="space-between" py={0.5}>
                <Typography variant="body2" color="text.secondary">
                  {e.reason}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary">
                  +{e.amount}
                </Typography>
              </Box>
            ))}
          </GlassCard>
        </Grid>

        <Grid item xs={12}>
          <GlassCard sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <SensorsIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                EMG + IMU Devices
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Closed-loop hardware data plane — every session generates clinician-validated, outcome-correlated sensor data.
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
              <Button variant="contained" size="small" disabled={pairing} onClick={() => pairDevice("COMBINED")}>
                Pair EMG + IMU kit
              </Button>
              <Button variant="outlined" size="small" disabled={pairing} onClick={() => pairDevice("EMG_BAND")}>
                Pair EMG band
              </Button>
              <Button variant="outlined" size="small" disabled={pairing} onClick={() => pairDevice("IMU")}>
                Pair IMU
              </Button>
              <Button
                variant="text"
                size="small"
                startIcon={<AssignmentIcon />}
                onClick={() => router.push("/patient/surveys")}
              >
                Outcome surveys
              </Button>
            </Box>
            {devices.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No devices paired yet.
              </Typography>
            ) : (
              devices.map((d) => (
                <Box key={d.id} display="flex" justifyContent="space-between" alignItems="center" py={1} borderBottom="1px solid rgba(0,0,0,0.06)">
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {d.label ?? d.type}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {d.serialNumber}
                    </Typography>
                  </Box>
                  <Chip label={d.status} size="small" color="success" variant="outlined" />
                </Box>
              ))
            )}
          </GlassCard>
        </Grid>
      </Grid>
      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack("")} message={snack} />
    </PatientShell>
  );
}
