"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, TextField, IconButton, Grid, CircularProgress } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import MemoryIcon from "@mui/icons-material/Memory";
import { api, getStoredToken } from "@/lib/api";
import { PatientShell } from "@/components/PatientShell";
import { GlassCard } from "@/components/GlassCard";

const suggestions = [
  "How am I doing with my readiness score?",
  "Is it safe to increase intensity this week?",
  "What should I focus on before my next session?",
];

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function SupportPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Array<{ role: "ai" | "user"; text: string; time: string }>>([
    {
      role: "ai",
      text: "Hello! I've analyzed your recent recovery data. How can I assist you with your return-to-sport journey today?",
      time: nowLabel(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) router.push("/login");
  }, [router]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const token = getStoredToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed, time: nowLabel() }]);
    setLoading(true);

    try {
      const { reply } = await api<{ reply: string }>("/patient/support/chat", {
        method: "POST",
        token,
        body: JSON.stringify({ message: trimmed }),
      });
      setMessages((prev) => [...prev, { role: "ai", text: reply, time: nowLabel() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "I'm having trouble reaching your recovery data right now. Please try again in a moment.",
          time: nowLabel(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PatientShell title="Support" subtitle="Kinetik Recovery AI" showNav>
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ minHeight: { md: "calc(100vh - 200px)" } }}>
        <Grid item xs={12} md={4} lg={3}>
          <GlassCard sx={{ p: 2, mb: { xs: 0, md: 2 }, display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(0,229,199,0.3)",
              }}
            >
              <MemoryIcon sx={{ color: "#00e5c7", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Kinetik Recovery AI
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#10b981" }} />
                <Typography variant="caption" color="text.secondary">
                  Synced with your data
                </Typography>
              </Box>
            </Box>
          </GlassCard>

          <Box display={{ xs: "flex", md: "block" }} flexWrap="wrap" gap={1}>
            {suggestions.map((s) => (
              <Box
                key={s}
                onClick={() => sendMessage(s)}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  fontSize: "0.8rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "text.secondary",
                  mb: { md: 1 },
                  "&:hover": { borderColor: "rgba(0,229,199,0.3)", color: "#00e5c7" },
                }}
              >
                {s}
              </Box>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={8} lg={9}>
          <Box display="flex" flexDirection="column" height="100%" minHeight={{ xs: 400, md: 500 }}>
            <Box display="flex" flexDirection="column" gap={2} mb={2} flex={1} overflow="auto">
              {messages.map((m, i) => (
                <Box
                  key={i}
                  sx={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: { xs: "90%", md: "70%" },
                  }}
                >
                  <Box
                    className="glass-card"
                    sx={{
                      p: 2,
                      ...(m.role === "user" && {
                        background: "linear-gradient(135deg, rgba(0,229,199,0.15), rgba(99,102,241,0.1))",
                        borderColor: "rgba(0,229,199,0.2)",
                      }),
                    }}
                  >
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {m.text}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", px: 1 }}>
                    {m.time}
                  </Typography>
                </Box>
              ))}
              {loading && (
                <Box display="flex" alignItems="center" gap={1} px={1}>
                  <CircularProgress size={16} sx={{ color: "#00e5c7" }} />
                  <Typography variant="caption" color="text.secondary">
                    Analyzing your recovery data...
                  </Typography>
                </Box>
              )}
            </Box>

            <Box display="flex" gap={1} alignItems="center">
              <TextField
                fullWidth
                placeholder="Ask about your recovery..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                size="small"
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 99,
                    bgcolor: "rgba(255,255,255,0.04)",
                  },
                }}
              />
              <IconButton
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                sx={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  background: "linear-gradient(135deg, #00e5c7, #6366f1)",
                  color: "#060a12",
                  "&:hover": { background: "linear-gradient(135deg, #00e5c7, #6366f1)" },
                  "&.Mui-disabled": { opacity: 0.5 },
                }}
              >
                <ArrowUpwardIcon />
              </IconButton>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </PatientShell>
  );
}
