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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaymentsIcon from "@mui/icons-material/Payments";
import { StatCard } from "@kinetik/ui";
import { api, getStoredToken } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";

interface Billing {
  clinicName: string;
  status: string;
  pricePerPatient: number;
  activeSeats: number;
  monthlyTotal: number;
  currentPeriodEnd: string;
  model: string;
}

export default function ClinicBillingPage() {
  const router = useRouter();
  const [data, setData] = useState<Billing | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }
    api<Billing>("/clinician/billing", { token }).then(setData);
  }, [router]);

  return (
    <Box minHeight="100vh" bgcolor="background.default">
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => router.push("/clinician")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} ml={1}>
            Clinic SaaS Billing
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <PaymentsIcon color="primary" />
          <Typography variant="h5" fontWeight={800}>
            ${data?.pricePerPatient ?? 80}/patient/month
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {data?.model ?? "SaaS to clinics — $80/patient/month"} (roadmap Phase 03 monetization).
        </Typography>

        {data && (
          <>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6}>
                <StatCard title="Active seats" value={data.activeSeats} gradient />
              </Grid>
              <Grid item xs={6}>
                <StatCard title="Monthly total" value={`$${data.monthlyTotal}`} gradient />
              </Grid>
            </Grid>
            <GlassCard sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Clinic
              </Typography>
              <Typography variant="h6" fontWeight={700} mb={2}>
                {data.clinicName}
              </Typography>
              <Typography variant="body2" mb={1}>
                Status: <strong>{data.status}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current period ends {new Date(data.currentPeriodEnd).toLocaleDateString()}
              </Typography>
            </GlassCard>
          </>
        )}
      </Container>
    </Box>
  );
}
