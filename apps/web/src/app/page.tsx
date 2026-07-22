"use client";

import { Box, Container, Typography, Button, Stack, Chip } from "@mui/material";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import PsychologyIcon from "@mui/icons-material/Psychology";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions";
import Link from "next/link";
import { MeshBackground } from "@/components/MeshBackground";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";

const features = [
  {
    icon: <MonitorHeartIcon sx={{ fontSize: 28 }} />,
    title: "Daily Accountability",
    description: "Pain logging, adherence tracking, and check-ins between PT visits.",
    color: "#00e5c7",
  },
  {
    icon: <FitnessCenterIcon sx={{ fontSize: 28 }} />,
    title: "Return-to-Sport Readiness",
    description: "Objective scoring beyond 'good enough for daily life.'",
    color: "#22d3ee",
  },
  {
    icon: <PsychologyIcon sx={{ fontSize: 28 }} />,
    title: "Psychological Recovery",
    description: "Confidence tracking and fear-of-reinjury monitoring.",
    color: "#6366f1",
  },
  {
    icon: <VisibilityIcon sx={{ fontSize: 28 }} />,
    title: "Clinician Visibility",
    description: "Low-burden alerts — adherence and readiness without extra work.",
    color: "#10b981",
  },
];

export default function LandingPage() {
  return (
    <Box minHeight="100vh" position="relative">
      <MeshBackground />
      <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 6, md: 10 } }}>
        <Box textAlign="center" mb={8}>
          <Box mb={3}>
            <Logo size="lg" />
          </Box>
          <Typography
            variant="overline"
            sx={{ color: "#00967d", letterSpacing: "0.2em", fontWeight: 600 }}
          >
            KINETIK TECHNOLOGIES
          </Typography>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              mt: 2,
              mb: 2,
              maxWidth: 720,
              mx: "auto",
              fontSize: { xs: "2rem", md: "3rem" },
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            Recovery doesn&apos;t end when{" "}
            <Box component="span" className="gradient-text">
              PT discharges you.
            </Box>
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 560, mx: "auto", mb: 4, fontWeight: 400, lineHeight: 1.6 }}
          >
            For athletes stuck between functional baseline and return-to-sport — your daily
            recovery coach with clinical-grade accountability.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button component={Link} href="/login" variant="contained" size="large" sx={{ px: 4, py: 1.5 }}>
              Sign In
            </Button>
            <Button component={Link} href="/onboard" variant="outlined" size="large" sx={{ px: 4, py: 1.5 }}>
              Activate with Clinician Code
            </Button>
          </Stack>
        </Box>

        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
          gap={2}
          mb={8}
        >
          {features.map((f) => (
            <GlassCard key={f.title} glow sx={{ p: 3 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  bgcolor: `${f.color}15`,
                  color: f.color,
                }}
              >
                {f.icon}
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {f.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {f.description}
              </Typography>
            </GlassCard>
          ))}
        </Box>

        <GlassCard glow sx={{ p: { xs: 3, md: 4 }, textAlign: "center", mb: 6 }}>
          <Box display="flex" justifyContent="center" mb={1.5}>
            <IntegrationInstructionsIcon sx={{ color: "#00967d", fontSize: 32 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} mb={1} sx={{ letterSpacing: "-0.01em" }}>
            Built to fit into the workflow clinics already have
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 480, mx: "auto", mb: 3, lineHeight: 1.6 }}
          >
            Kinetik is designed to connect directly with the EHR and Practice Management
            systems clinics already run on — no extra data entry, no workflow disruption.
          </Typography>
          <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Chip label="Epic" variant="outlined" />
            <Chip label="athenahealth" variant="outlined" />
            <Chip label="Practice Fusion" variant="outlined" />
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" mt={2} sx={{ opacity: 0.8 }}>
            Integrations in active development
          </Typography>
        </GlassCard>

        <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ opacity: 0.6 }}>
          HIPAA-compliant · Built for athletes · Trusted by clinicians
        </Typography>
      </Container>
    </Box>
  );
}
