"use client";

import { Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

interface PerformanceBannerProps {
  streak: number;
  adherence: number;
  readinessGain?: number;
  rankText?: string;
}

export function PerformanceBanner({
  streak,
  adherence,
  readinessGain,
  rankText = "Top 10%",
}: PerformanceBannerProps) {
  return (
    <Box
      sx={{
        borderRadius: "20px",
        p: { xs: 3, md: 4 },
        background: "linear-gradient(135deg, #00c9a7 0%, #00e5c7 30%, #22d3ee 60%, #6366f1 100%)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 40px rgba(0, 229, 199, 0.25)",
        color: "#ffffff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -60,
          right: -60,
          width: { xs: 160, md: 240 },
          height: { xs: 160, md: 240 },
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      />
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 99,
              bgcolor: "rgba(0,0,0,0.2)",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 14 }} />
            {rankText}
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>
            This week
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            mb: { xs: 2.5, md: 3 },
            maxWidth: { xs: 280, md: 480, lg: 560 },
            lineHeight: 1.3,
            fontSize: { xs: "1.25rem", md: "1.5rem", lg: "1.75rem" },
          }}
        >
          You&apos;re building real return-to-sport momentum.
        </Typography>
      </Box>
      <Box
        display="flex"
        gap={{ xs: 3, md: 5, lg: 6 }}
        sx={{
          pt: 2,
          borderTop: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {streak}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            day streak
          </Typography>
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {Math.round(adherence)}%
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            adherence
          </Typography>
        </Box>
        {readinessGain !== undefined && readinessGain !== 0 && (
          <Box>
            <Typography variant="h4" fontWeight={800}>
              {readinessGain > 0 ? "+" : ""}{Math.round(readinessGain)}%
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              readiness
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
