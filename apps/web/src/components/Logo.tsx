"use client";

import { Box, Typography } from "@mui/material";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export function Logo({ size = "md", showTagline = false }: LogoProps) {
  const iconSize = size === "sm" ? 32 : size === "lg" ? 56 : 44;
  const fontSize = size === "sm" ? "1.1rem" : size === "lg" ? "1.75rem" : "1.35rem";

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={showTagline ? 1.5 : 0}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box
          sx={{
            width: iconSize,
            height: iconSize,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #00e5c7, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(0,229,199,0.35)",
          }}
        >
          <Box
            sx={{
              width: iconSize * 0.45,
              height: iconSize * 0.45,
              borderRadius: "50%",
              bgcolor: "#060a12",
            }}
          />
        </Box>
        <Typography
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            fontSize,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #f1f5f9, #94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Kinetik
        </Typography>
      </Box>
      {showTagline && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          maxWidth={280}
          sx={{ lineHeight: 1.5 }}
        >
          Clinical-grade return-to-sport recovery, in the palm of your hand.
        </Typography>
      )}
    </Box>
  );
}
