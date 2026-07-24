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
  Chip,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { StatCard } from "@kinetik/ui";
import { api, getStoredToken, clearAuth } from "@/lib/api";
import { MeshBackground } from "@/components/MeshBackground";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";

interface PayerDashboard {
  organization: string;
  region?: string;
  stats: {
    coveredPatients: number;
    rtmEnrolled: number;
    rtmQualifiedThisMonth: number;
    avgReadiness: number;
    highPainFlags: number;
  };
  cohort: Array<{
    id: string;
    name: string;
    injuryType: string;
    sport?: string;
    recoveryPhase: string;
    readinessScore?: number;
    latestPain?: number;
    rtmEnrolled: boolean;
    rtmDataDays: number;
    rtmQualifies: boolean;
    lastClaimCpt: string[];
  }>;
  valueNarrative: string;
}

export default function PayerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<PayerDashboard | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<PayerDashboard>("/payer/dashboard", { token })
      .then(setData)
      .catch(() => router.push("/login"));
  }, [router]);

  if (!data) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <MeshBackground />
        <Typography color="text.secondary">Loading payer portal...</Typography>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" position="relative">
      <MeshBackground />
      <Container maxWidth="lg" sx={{ py: 4, position: "relative" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <Logo size="sm" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Payer Portal
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>
                {data.organization}
                {data.region ? ` · ${data.region}` : ""}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              clearAuth();
              router.push("/");
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Box>

        <Typography variant="h4" fontWeight={800} mb={1} sx={{ letterSpacing: "-0.02em" }}>
          Population Outcomes
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} maxWidth={720}>
          {data.valueNarrative}
        </Typography>

        <Grid container spacing={2} mb={4}>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard title="Covered" value={data.stats.coveredPatients} gradient />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatCard title="RTM enrolled" value={data.stats.rtmEnrolled} gradient />
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <StatCard title="98977 ready" value={data.stats.rtmQualifiedThisMonth} />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <StatCard title="Avg readiness" value={data.stats.avgReadiness} gradient />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatCard title="High pain" value={data.stats.highPainFlags} />
          </Grid>
        </Grid>

        <GlassCard sx={{ p: 0, overflow: "hidden" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
            Covered cohort
          </Typography>
          {data.cohort.map((p) => (
            <Box
              key={p.id}
              px={2.5}
              py={1.5}
              borderBottom="1px solid rgba(0,0,0,0.06)"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {p.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.injuryType}
                  {p.sport ? ` · ${p.sport}` : ""} · {p.recoveryPhase.replace(/_/g, " ")}
                </Typography>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip size="small" label={`Readiness ${p.readinessScore != null ? Math.round(p.readinessScore) : "—"}`} />
                <Chip size="small" label={`${p.rtmDataDays} RTM days`} variant="outlined" />
                {p.rtmQualifies && <Chip size="small" color="primary" label="RTM qualified" />}
                {(p.latestPain ?? 0) >= 7 && <Chip size="small" color="warning" label={`Pain ${p.latestPain}`} />}
              </Box>
            </Box>
          ))}
        </GlassCard>
      </Container>
    </Box>
  );
}
