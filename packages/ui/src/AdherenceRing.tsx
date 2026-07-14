"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

interface AdherenceRingProps {
  rate: number;
  streak?: number;
  size?: number;
}

export function AdherenceRing({ rate, streak, size = 120 }: AdherenceRingProps) {
  const color = rate >= 80 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <Box position="relative" display="inline-flex" flexDirection="column" alignItems="center">
      <Box position="relative" display="inline-flex">
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={3}
          sx={{ color: "rgba(255,255,255,0.08)" }}
        />
        <CircularProgress
          variant="determinate"
          value={rate}
          size={size}
          thickness={3}
          sx={{
            color,
            position: "absolute",
            left: 0,
            filter: `drop-shadow(0 0 8px ${color}80)`,
          }}
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          right={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Typography variant="h5" fontWeight={800}>
            {Math.round(rate)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            adherence
          </Typography>
        </Box>
      </Box>
      {streak !== undefined && streak > 0 && (
        <Typography
          variant="body2"
          fontWeight={600}
          mt={1}
          sx={{
            background: "linear-gradient(135deg, #00e5c7, #22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {streak}-day streak
        </Typography>
      )}
    </Box>
  );
}
