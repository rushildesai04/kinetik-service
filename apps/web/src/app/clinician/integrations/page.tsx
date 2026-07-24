"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, AppBar, Toolbar, IconButton, Chip, Button, Snackbar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import DescriptionIcon from "@mui/icons-material/Description";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import { api, getStoredToken } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";

const VENDORS = [
  {
    vendor: "EPIC" as const,
    name: "Epic",
    description: "Sync patient rosters, orders, and outcome data via Epic's App Orchard / FHIR APIs.",
    icon: <LocalHospitalIcon />,
    accent: "#00e5c7",
  },
  {
    vendor: "ATHENA" as const,
    name: "athenahealth",
    description: "Pull scheduled patients and push adherence/readiness summaries back into the chart.",
    icon: <MonitorHeartIcon />,
    accent: "#6366f1",
  },
  {
    vendor: "PRACTICE_FUSION" as const,
    name: "Practice Fusion",
    description: "Auto-enroll patients discharged from PT and sync progress notes automatically.",
    icon: <DescriptionIcon />,
    accent: "#22d3ee",
  },
];

interface EhrConnection {
  vendor: string;
  status: string;
  connectedAt?: string;
  lastSyncAt?: string;
  externalOrgId?: string;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<EhrConnection[]>([]);
  const [snack, setSnack] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<EhrConnection[]>("/clinician/ehr", { token }).then(setConnections);
  }

  useEffect(() => {
    load();
  }, [router]);

  function statusFor(vendor: string) {
    return connections.find((c) => c.vendor === vendor);
  }

  async function connect(vendor: string) {
    const token = getStoredToken();
    if (!token) return;
    setBusy(vendor);
    try {
      await api("/clinician/ehr/connect", {
        method: "POST",
        token,
        body: JSON.stringify({ vendor }),
      });
      setSnack(`${vendor} connected (sandbox FHIR)`);
      load();
    } catch (e) {
      setSnack(e instanceof Error ? e.message : "Connect failed");
    } finally {
      setBusy(null);
    }
  }

  async function sync(vendor: string) {
    const token = getStoredToken();
    if (!token) return;
    setBusy(vendor);
    try {
      const res = await api<{ message: string }>(`/clinician/ehr/${vendor}/sync`, {
        method: "POST",
        token,
      });
      setSnack(res.message);
      load();
    } catch (e) {
      setSnack(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push("/clinician")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} ml={1}>
            EHR &amp; PMS Integrations
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <IntegrationInstructionsIcon color="primary" />
          <Chip label="Platform moat" size="small" color="primary" variant="outlined" />
        </Box>
        <Typography variant="h5" fontWeight={800} mb={1} sx={{ letterSpacing: "-0.01em" }}>
          Embed Kinetik in daily PT workflow
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Higher switching cost through EHR connectivity — roster sync, adherence write-back, and discharge auto-enroll.
        </Typography>

        {VENDORS.map((integration) => {
          const conn = statusFor(integration.vendor);
          const connected = conn?.status === "CONNECTED";
          return (
            <GlassCard key={integration.name} sx={{ p: 2.5, mb: 2 }}>
              <Box display="flex" alignItems="flex-start" gap={2}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: `${integration.accent}18`,
                    color: integration.accent,
                  }}
                >
                  {integration.icon}
                </Box>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                    <Typography variant="subtitle1" fontWeight={700}>
                      {integration.name}
                    </Typography>
                    <Chip
                      label={connected ? "Connected" : "Not connected"}
                      size="small"
                      color={connected ? "success" : "default"}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {integration.description}
                  </Typography>
                  {connected && conn?.lastSyncAt && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Last sync {new Date(conn.lastSyncAt).toLocaleString()}
                      {conn.externalOrgId ? ` · ${conn.externalOrgId}` : ""}
                    </Typography>
                  )}
                </Box>
              </Box>
              {connected ? (
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={busy === integration.vendor}
                  onClick={() => sync(integration.vendor)}
                >
                  {busy === integration.vendor ? "Syncing..." : "Sync now"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={busy === integration.vendor}
                  onClick={() => connect(integration.vendor)}
                >
                  {busy === integration.vendor ? "Connecting..." : "Connect"}
                </Button>
              )}
            </GlassCard>
          );
        })}
      </Container>
      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack("")} message={snack} />
    </Box>
  );
}
