"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  Button,
  Chip,
  TextField,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { StatCard } from "@kinetik/ui";
import { api, getStoredToken } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";

interface RtmPatient {
  patientId: string;
  name: string;
  injuryType: string;
  enrolled: boolean;
  dataDays: number;
  totalMinutes: number;
  qualifies98977: boolean;
  lastClaimAt: string | null;
}

export default function RtmBillingPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<RtmPatient[]>([]);
  const [month, setMonth] = useState("");
  const [commMinutes, setCommMinutes] = useState<Record<string, number>>({});
  const [snack, setSnack] = useState("");

  function load() {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<{ patients: RtmPatient[]; month: string }>("/clinician/rtm", { token }).then((d) => {
      setPatients(d.patients);
      setMonth(d.month);
    });
  }

  useEffect(() => {
    load();
  }, [router]);

  async function enroll(patientId: string) {
    const token = getStoredToken();
    if (!token) return;
    await api(`/clinician/rtm/${patientId}/enroll`, { method: "POST", token });
    setSnack("Patient enrolled in RTM");
    load();
  }

  async function logComm(patientId: string) {
    const token = getStoredToken();
    if (!token) return;
    const minutes = commMinutes[patientId] || 20;
    await api(`/clinician/rtm/${patientId}/communication`, {
      method: "POST",
      token,
      body: JSON.stringify({ minutes, note: "Interactive RTM communication" }),
    });
    setSnack(`Logged ${minutes} min communication`);
    load();
  }

  async function exportClaim(patientId: string) {
    const token = getStoredToken();
    if (!token) return;
    const claim = await api<{
      cptCodes: string[];
      dataDays: number;
      totalMinutes: number;
      patientName: string;
      periodStart: string;
      periodEnd: string;
    }>(`/clinician/rtm/${patientId}/claim`, { method: "POST", token });

    const blob = new Blob([JSON.stringify(claim, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rtm-claim-${claim.patientName.replace(/\s+/g, "-")}-${claim.periodStart}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnack(`Claim exported: ${claim.cptCodes.join(", ")}`);
    load();
  }

  const enrolled = patients.filter((p) => p.enrolled).length;
  const qualified = patients.filter((p) => p.qualifies98977).length;

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push("/clinician")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} ml={1}>
            RTM Billing Engine
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <ReceiptLongIcon color="primary" />
          <Typography variant="h5" fontWeight={800}>
            Remote Therapeutic Monitoring
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          CPT 98975–98981 packaging for {month}. Track data days (≥16 for 98977) and interactive minutes (98980/98981).
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={4}>
            <StatCard title="Roster" value={patients.length} gradient />
          </Grid>
          <Grid item xs={4}>
            <StatCard title="RTM Enrolled" value={enrolled} gradient />
          </Grid>
          <Grid item xs={4}>
            <StatCard title="98977 Ready" value={qualified} />
          </Grid>
        </Grid>

        {patients.map((p) => (
          <GlassCard key={p.patientId} sx={{ p: 2.5, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {p.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.injuryType}
                </Typography>
                <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={p.enrolled ? "Enrolled" : "Not enrolled"}
                    color={p.enrolled ? "success" : "default"}
                    variant="outlined"
                  />
                  <Chip size="small" label={`${p.dataDays} data days`} variant="outlined" />
                  <Chip size="small" label={`${p.totalMinutes} min`} variant="outlined" />
                  {p.qualifies98977 && <Chip size="small" label="98977 ready" color="primary" />}
                </Box>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                {!p.enrolled ? (
                  <Button size="small" variant="contained" onClick={() => enroll(p.patientId)}>
                    Enroll RTM
                  </Button>
                ) : (
                  <>
                    <TextField
                      size="small"
                      type="number"
                      label="Comm min"
                      value={commMinutes[p.patientId] ?? 20}
                      onChange={(e) =>
                        setCommMinutes((m) => ({ ...m, [p.patientId]: Number(e.target.value) }))
                      }
                      sx={{ width: 100 }}
                    />
                    <Button size="small" variant="outlined" onClick={() => logComm(p.patientId)}>
                      Log call
                    </Button>
                    <Button size="small" variant="contained" onClick={() => exportClaim(p.patientId)}>
                      Export claim
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </GlassCard>
        ))}
      </Container>
      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack("")} message={snack} />
    </Box>
  );
}
