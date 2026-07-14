"use client";

import { Box, type SxProps, type Theme } from "@mui/material";

interface GlassCardProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  glow?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, sx, glow, gradient, onClick }: GlassCardProps) {
  return (
    <Box
      className={gradient ? "gradient-border" : "glass-card"}
      onClick={onClick}
      sx={{
        p: 3,
        cursor: onClick ? "pointer" : "default",
        ...(glow && { boxShadow: "0 0 40px rgba(0,229,199,0.12)" }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
