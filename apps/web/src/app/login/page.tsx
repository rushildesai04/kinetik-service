"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Button,
  Typography,
  Alert,
  Link as MuiLink,
} from "@mui/material";
import Link from "next/link";
import { api, storeAuth } from "@/lib/api";
import { MeshBackground } from "@/components/MeshBackground";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { AuthField } from "@/components/AuthField";

function formatApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Login failed. Please check your credentials.";
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Please enter your email and password.");
      setLoading(false);
      return;
    }

    try {
      const result = await api<{ token: string; user: { role: string; firstName: string } }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      );
      storeAuth(result.token, result.user);
      router.push(result.user.role === "PATIENT" ? "/patient" : "/clinician");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" position="relative">
      <MeshBackground />
      <Container maxWidth="sm" sx={{ position: "relative" }}>
        <Box mb={4}>
          <Logo size="md" showTagline />
        </Box>
        <GlassCard gradient sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Sign in to continue your recovery journey
          </Typography>
          <form onSubmit={handleSubmit} noValidate>
            <AuthField
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <AuthField
              label="Password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2, bgcolor: "rgba(239,68,68,0.1)" }}>
                {error}
              </Alert>
            )}
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <Typography variant="body2" textAlign="center" mt={3} color="text.secondary">
            New patient?{" "}
            <MuiLink component={Link} href="/onboard" sx={{ color: "#00e5c7" }}>
              Activate with clinician code
            </MuiLink>
          </Typography>
        </GlassCard>
      </Container>
    </Box>
  );
}
