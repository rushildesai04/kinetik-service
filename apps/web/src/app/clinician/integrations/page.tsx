"use client";

import { useRouter } from "next/navigation";
import { Box, Container, Typography, AppBar, Toolbar, IconButton, Chip, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import DescriptionIcon from "@mui/icons-material/Description";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import { GlassCard } from "@/components/GlassCard";

interface IntegrationInfo {
  name: string;
  description: string;
  status: string;
  icon: React.ReactNode;
  accent: string;
}

const INTEGRATIONS: IntegrationInfo[] = [
  {
    name: "Epic",
    description: "Sync patient rosters, orders, and outcome data via Epic's App Orchard / FHIR APIs.",
    status: "In development",
    icon: <LocalHospitalIcon />,
    accent: "#00e5c7",
  },
  {
    name: "athenahealth",
    description: "Pull scheduled patients and push adherence/readiness summaries back into the chart.",
    status: "In development",
    icon: <MonitorHeartIcon />,
    accent: "#6366f1",
  },
  {
    name: "Practice Fusion",
    description: "Auto-enroll patients discharged from PT and sync progress notes automatically.",
    status: "Planned",
    icon: <DescriptionIcon />,
    accent: "#22d3ee",
  },
];

export default function IntegrationsPage() {
  const router = useRouter();

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
          <IntegrationInstructionsIcon sx={{ color: "#00967d" }} />
          <Chip label="Work in progress" size="small" color="primary" variant="outlined" />
        </Box>
        <Typography variant="h5" fontWeight={800} mb={1} sx={{ letterSpacing: "-0.01em" }}>
          Bring Kinetik into your existing workflow
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          We're building direct connections to the EHR and Practice Management systems clinics
          already use, so patient rosters, notes, and outcomes sync automatically — no double
          data entry. Here's what's currently in progress.
        </Typography>

        {INTEGRATIONS.map((integration) => (
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
                  <Chip label={integration.status} size="small" variant="outlined" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {integration.description}
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" fullWidth disabled sx={{ mt: 2 }}>
              Connect — coming soon
            </Button>
          </GlassCard>
        ))}

        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
          Want your clinic's system prioritized? Let your Kinetik contact know which one you use.
        </Typography>
      </Container>
    </Box>
  );
}
