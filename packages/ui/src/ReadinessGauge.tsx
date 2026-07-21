"use client";

import { Box, LinearProgress, Typography, Chip } from "@mui/material";

interface ReadinessGaugeProps {
  score: number;
  recommendation: string;
  showBreakdown?: {
    physical: number;
    psychological: number;
    adherence: number;
    functional: number;
  };
}

function readinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Sport Ready", color: "#10b981" };
  if (score >= 60) return { label: "Progressing", color: "#22d3ee" };
  if (score >= 40) return { label: "Building", color: "#f59e0b" };
  return { label: "Not Ready", color: "#ef4444" };
}

export function ReadinessGauge({ score, recommendation, showBreakdown }: ReadinessGaugeProps) {
  const { label, color } = readinessLabel(score);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              background: "linear-gradient(135deg, #00e5c7, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}
          >
            {Math.round(score)}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Return-to-Sport Readiness
          </Typography>
        </Box>
        <Chip
          label={label}
          size="small"
          sx={{
            bgcolor: `${color}20`,
            color,
            fontWeight: 600,
            border: `1px solid ${color}40`,
          }}
        />
      </Box>
      <Box
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: "rgba(15,23,42,0.08)",
          overflow: "hidden",
          mb: 2,
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: `${score}%`,
            borderRadius: 5,
            background: "linear-gradient(90deg, #00e5c7, #6366f1)",
            boxShadow: "0 0 12px rgba(0,229,199,0.4)",
            transition: "width 0.6s ease",
          }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.6 }}>
        {recommendation}
      </Typography>
      {showBreakdown && (
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
          {[
            { key: "Physical", value: showBreakdown.physical },
            { key: "Psychological", value: showBreakdown.psychological },
            { key: "Adherence", value: showBreakdown.adherence },
            { key: "Functional", value: showBreakdown.functional },
          ].map(({ key, value }) => (
            <Box key={key}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {key}
                </Typography>
                <Typography variant="caption" fontWeight={600} color="primary">
                  {Math.round(value)}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={value} sx={{ height: 4, borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
