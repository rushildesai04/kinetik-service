"use client";

import { Box, Typography } from "@mui/material";

interface MetricChipProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  onClick?: () => void;
}

export function MetricChip({ icon, label, value, color = "#00e5c7", onClick }: MetricChipProps) {
  return (
    <Box
      className="glass-card"
      onClick={onClick}
      sx={{
        p: 2,
        textAlign: "center",
        flex: 1,
        minWidth: 0,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s, transform 0.2s",
        "&:hover": onClick ? { borderColor: "rgba(0,229,199,0.3)", transform: "translateY(-2px)" } : {},
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 1,
          bgcolor: `${color}18`,
          color,
        }}
      >
        {icon}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}
