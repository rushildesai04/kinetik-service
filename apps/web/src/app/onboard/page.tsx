"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  Grid,
  InputBase,
} from "@mui/material";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import BluetoothIcon from "@mui/icons-material/Bluetooth";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { api, storeAuth } from "@/lib/api";
import { MeshBackground } from "@/components/MeshBackground";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedHipaa, setAgreedHipaa] = useState(false);

  const [clinicianCode, setClinicianCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [injuryType, setInjuryType] = useState("");
  const [sport, setSport] = useState("");
  const [sportGoal, setSportGoal] = useState("");

  const canActivate = clinicianCode && agreedTerms && agreedHipaa;

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const result = await api<{ token: string; user: object }>("/auth/onboard", {
        method: "POST",
        body: JSON.stringify({
          clinicianCode,
          firstName,
          lastName,
          email,
          password,
          injuryType,
          sport: sport || undefined,
          sportGoal: sportGoal || undefined,
        }),
      });
      storeAuth(result.token, result.user);
      router.push("/patient");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box minHeight="100vh" py={6} position="relative">
      <MeshBackground />
      <Container maxWidth="sm" sx={{ position: "relative" }}>
        <Box mb={4}>
          <Logo size="lg" showTagline />
        </Box>

        {step === 0 && (
          <GlassCard gradient sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Activate your account
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Enter the prescription code provided by your clinician
            </Typography>

            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Clinician Prescribed Code
            </Typography>
            <InputBase
              name="clinicianCode"
              placeholder="KINETIK-DEMO"
              value={clinicianCode}
              onChange={(e) => setClinicianCode(e.target.value.toUpperCase())}
              fullWidth
              sx={{
                px: 2,
                py: 1.5,
                mb: 2.5,
                borderRadius: "12px",
                bgcolor: "rgba(15,23,42,0.02)",
                border: "1px solid rgba(15,23,42,0.1)",
                color: "#0f172a",
                "&.Mui-focused": {
                  borderColor: "#00967d",
                  boxShadow: "0 0 0 3px rgba(0,184,154,0.12)",
                },
              }}
              startAdornment={
                <InputAdornment position="start">
                  <VpnKeyOutlinedIcon sx={{ color: "#64748b", fontSize: 20 }} />
                </InputAdornment>
              }
            />

            <FormControlLabel
              control={
                <Checkbox checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I agree to the Terms &amp; Conditions
                </Typography>
              }
              sx={{ mb: 0.5, ml: 0 }}
            />
            <FormControlLabel
              control={
                <Checkbox checked={agreedHipaa} onChange={(e) => setAgreedHipaa(e.target.checked)} />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I agree to the HIPAA Data Privacy Policy
                </Typography>
              }
              sx={{ mb: 3, ml: 0 }}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={!canActivate}
              startIcon={<BluetoothIcon />}
              onClick={() => setStep(1)}
              sx={{ py: 1.5 }}
            >
              Continue Setup
            </Button>

            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2.5}>
              <ShieldOutlinedIcon sx={{ fontSize: 14, color: "#64748b" }} />
              <Typography variant="caption" color="text.secondary">
                End-to-end encrypted · HIPAA compliant
              </Typography>
            </Box>
          </GlassCard>
        )}

        {step === 1 && (
          <GlassCard gradient sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={3}>
              Your profile
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField label="First Name" fullWidth required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Last Name" fullWidth required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Grid>
            </Grid>
            <TextField label="Email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Password" type="password" fullWidth required value={password} onChange={(e) => setPassword(e.target.value)} helperText="Minimum 8 characters" sx={{ mb: 3 }} />
            <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setStep(0)}>Back</Button>
            <Button variant="contained" disabled={!firstName || !lastName || !email || password.length < 8} onClick={() => setStep(2)}>Continue</Button>
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard gradient sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={3}>
              Injury &amp; goals
            </Typography>
            <TextField label="Injury Type" fullWidth required value={injuryType} onChange={(e) => setInjuryType(e.target.value)} placeholder="e.g. ACL reconstruction" sx={{ mb: 2 }} />
            <TextField label="Primary Sport" fullWidth value={sport} onChange={(e) => setSport(e.target.value)} placeholder="e.g. Soccer, triathlon" sx={{ mb: 2 }} />
            <TextField label="Return-to-Sport Goal" fullWidth multiline rows={2} value={sportGoal} onChange={(e) => setSportGoal(e.target.value)} placeholder="What does fully recovered mean to you?" sx={{ mb: 3 }} />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button variant="outlined" sx={{ mr: 1 }} onClick={() => setStep(1)}>Back</Button>
            <Button variant="contained" disabled={!injuryType || loading} onClick={handleSubmit}>
              {loading ? "Activating..." : "Start Recovery"}
            </Button>
          </GlassCard>
        )}

        <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={3}>
          Need help? Contact your provider after sign-in via Support.
        </Typography>
      </Container>
    </Box>
  );
}
