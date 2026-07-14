"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Button,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import { ReadinessGauge, AdherenceRing, AlertChip } from "@kinetik/ui";
import { api, getStoredToken } from "@/lib/api";

interface PatientDetail {
  name: string;
  injuryType: string;
  sport?: string;
  sportGoal?: string;
  recoveryPhase: string;
  adherenceRate: number;
  readinessScore?: number;
  checkInHistory: Array<{
    date: string;
    painScore: number;
    confidenceScore: number;
    moodNote?: string;
  }>;
  readinessHistory: Array<{
    overallScore: number;
    recommendation: string;
    physicalScore: number;
    psychologicalScore: number;
    adherenceScore: number;
    functionalScore: number;
  }>;
  activeProgram?: {
    programName: string;
    exercises: Array<{ name: string; sets: number; reps: number; bodyRegion: string }>;
  };
  alerts: Array<{ id: string; type: string; severity: "INFO" | "WARNING" | "CRITICAL"; message: string; isRead: boolean }>;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const [data, setData] = useState<PatientDetail | null>(null);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState("");

  function loadPatient() {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<PatientDetail>(`/clinician/patients/${patientId}`, { token })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load patient"));
  }

  useEffect(() => {
    loadPatient();
  }, [router, patientId]);

  async function dismissAlert(alertId: string) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api(`/clinician/alerts/${alertId}/read`, { method: "PATCH", token });
      setSnack("Alert dismissed");
      loadPatient();
    } catch {
      setSnack("Failed to dismiss alert");
    }
  }

  if (error) {
    return (
      <Box minHeight="100vh" bgcolor="background.default" display="flex" flexDirection="column" alignItems="center" justifyContent="center" px={3}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>{error}</Alert>
        <Button variant="contained" onClick={() => router.push("/clinician")}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading patient...</Typography>
      </Box>
    );
  }

  const latestReadiness = data.readinessHistory[0];
  const unreadAlerts = data.alerts.filter((a) => !a.isRead);

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push("/clinician")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} ml={1}>
            {data.name}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
          <Chip label={data.injuryType} />
          {data.sport && <Chip label={data.sport} variant="outlined" />}
          <Chip label={data.recoveryPhase.replace(/_/g, " ")} color="primary" variant="outlined" />
        </Box>

        {data.sportGoal && (
          <Typography variant="body2" color="text.secondary" mb={3}>
            Goal: {data.sportGoal}
          </Typography>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ textAlign: "center", py: 2 }}>
              <AdherenceRing rate={data.adherenceRate} />
            </Card>
          </Grid>
          <Grid item xs={12} sm={8}>
            <Card>
              <CardContent>
                {latestReadiness ? (
                  <ReadinessGauge
                    score={latestReadiness.overallScore}
                    recommendation={latestReadiness.recommendation}
                    showBreakdown={{
                      physical: latestReadiness.physicalScore,
                      psychological: latestReadiness.psychologicalScore,
                      adherence: latestReadiness.adherenceScore,
                      functional: latestReadiness.functionalScore,
                    }}
                  />
                ) : (
                  <Typography color="text.secondary">No readiness data yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {unreadAlerts.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Active Alerts
              </Typography>
              {unreadAlerts.map((a) => (
                <Box key={a.id} display="flex" alignItems="center" justifyContent="space-between" gap={1} mb={1.5}>
                  <Box display="flex" alignItems="center" gap={1} flex={1}>
                    <AlertChip type={a.type} severity={a.severity} />
                    <Typography variant="body2">{a.message}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => dismissAlert(a.id)} title="Dismiss alert">
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Recent Check-Ins
                </Typography>
                <List dense>
                  {data.checkInHistory.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      No check-ins yet
                    </Typography>
                  ) : (
                    data.checkInHistory.map((c, i) => (
                      <ListItem key={i} disableGutters>
                        <ListItemText
                          primary={`Pain ${c.painScore}/10 · Confidence ${c.confidenceScore}/10`}
                          secondary={
                            new Date(c.date).toLocaleDateString() +
                            (c.moodNote ? ` — ${c.moodNote}` : "")
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Active Program
                </Typography>
                {data.activeProgram ? (
                  <>
                    <Typography variant="body2" fontWeight={600} mb={1.5} color="primary">
                      {data.activeProgram.programName}
                    </Typography>
                    {data.activeProgram.exercises.map((ex, i) => (
                      <Box key={i} mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {ex.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ex.sets}×{ex.reps} · {ex.bodyRegion}
                        </Typography>
                      </Box>
                    ))}
                  </>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    No active program assigned
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack("")} message={snack} />
    </Box>
  );
}
