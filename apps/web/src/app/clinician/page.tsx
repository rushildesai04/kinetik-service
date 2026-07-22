"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, IconButton, Grid, Button, Snackbar } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckIcon from "@mui/icons-material/Check";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import { StatCard, PatientRow, AlertChip } from "@kinetik/ui";
import { api, getStoredToken, clearAuth } from "@/lib/api";
import { MeshBackground } from "@/components/MeshBackground";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";

interface ClinicianDashboard {
  stats: {
    totalPatients: number;
    avgAdherence: number;
    criticalAlerts: number;
    patientsNeedingAttention: number;
  };
  patients: Array<{
    id: string;
    name: string;
    injuryType: string;
    sport?: string;
    painScore?: number;
    adherenceRate: number;
    readinessScore?: number;
    unreadAlerts: number;
  }>;
  alerts: Array<{
    id: string;
    patientId: string;
    patientName: string;
    type: string;
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
    createdAt: string;
  }>;
}

export default function ClinicianDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ClinicianDashboard | null>(null);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState("");

  function loadDashboard() {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<ClinicianDashboard>("/clinician/dashboard", { token })
      .then(setData)
      .catch(() => router.push("/login"));
  }

  useEffect(() => {
    loadDashboard();
  }, [router]);

  function handleLogout() {
    clearAuth();
    router.push("/");
  }

  async function dismissAlert(alertId: string) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api(`/clinician/alerts/${alertId}/read`, { method: "PATCH", token });
      setSnack("Alert marked as read");
      loadDashboard();
    } catch {
      setSnack("Failed to dismiss alert");
    }
  }

  if (error) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <MeshBackground />
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <MeshBackground />
        <Typography color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" position="relative">
      <MeshBackground />
      <Box maxWidth={1100} mx="auto" px={3} py={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Logo size="sm" />
            <Typography variant="caption" color="text.secondary">
              Clinician Portal
            </Typography>
          </Box>
          <IconButton onClick={handleLogout} sx={{ color: "#64748b" }}>
            <LogoutIcon />
          </IconButton>
        </Box>

        <Typography variant="h4" fontWeight={800} mb={3} sx={{ letterSpacing: "-0.02em" }}>
          Patient Overview
        </Typography>

        <GlassCard
          sx={{
            p: 2.5,
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #00e5c7, #6366f1)",
              }}
            >
              <IntegrationInstructionsIcon sx={{ color: "#fff" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Connect your EHR / PMS
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sync rosters and notes with Epic, athenahealth, Practice Fusion & more
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<IntegrationInstructionsIcon />}
            onClick={() => router.push("/clinician/integrations")}
          >
            Connect
          </Button>
        </GlassCard>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Active Patients" value={data.stats.totalPatients} icon={<PeopleIcon />} gradient />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Avg Adherence" value={`${data.stats.avgAdherence}%`} icon={<TrendingUpIcon />} gradient />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Critical Alerts" value={data.stats.criticalAlerts} icon={<WarningAmberIcon />} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Need Attention" value={data.stats.patientsNeedingAttention} gradient />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <GlassCard sx={{ p: 0, overflow: "hidden" }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                Your Patients
              </Typography>
              {data.patients.length === 0 ? (
                <Typography color="text.secondary" p={2.5}>
                  No patients yet. Share your onboarding code.
                </Typography>
              ) : (
                data.patients.map((p) => (
                  <PatientRow
                    key={p.id}
                    name={p.name}
                    injuryType={p.injuryType}
                    sport={p.sport}
                    painScore={p.painScore}
                    adherenceRate={p.adherenceRate}
                    readinessScore={p.readinessScore}
                    unreadAlerts={p.unreadAlerts}
                    onClick={() => router.push(`/clinician/patients/${p.id}`)}
                  />
                ))
              )}
            </GlassCard>
          </Grid>

          <Grid item xs={12} md={5}>
            <GlassCard sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Recent Alerts
              </Typography>
              {data.alerts.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No active alerts — all patients on track.
                </Typography>
              ) : (
                data.alerts.slice(0, 8).map((alert) => (
                  <Box key={alert.id} mb={2} pb={2} borderBottom="1px solid rgba(15,23,42,0.08)">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ cursor: "pointer", "&:hover": { color: "#00967d" } }}
                        onClick={() => router.push(`/clinician/patients/${alert.patientId}`)}
                      >
                        {alert.patientName}
                      </Typography>
                      <AlertChip type={alert.type} severity={alert.severity} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {alert.message}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="text"
                        sx={{ fontSize: "0.7rem", color: "#00967d" }}
                        onClick={() => router.push(`/clinician/patients/${alert.patientId}`)}
                      >
                        View patient
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<CheckIcon sx={{ fontSize: 14 }} />}
                        sx={{ fontSize: "0.7rem", color: "text.secondary" }}
                        onClick={() => dismissAlert(alert.id)}
                      >
                        Dismiss
                      </Button>
                    </Box>
                  </Box>
                ))
              )}
            </GlassCard>
          </Grid>
        </Grid>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack("")} message={snack} />
    </Box>
  );
}
