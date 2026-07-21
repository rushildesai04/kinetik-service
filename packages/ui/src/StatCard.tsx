"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: boolean;
}

export function StatCard({ title, value, subtitle, icon, gradient }: StatCardProps) {
  return (
    <Box
      className="glass-card"
      sx={{
        p: 2,
        height: "100%",
        ...(gradient && {
          background: "linear-gradient(145deg, rgba(0,229,199,0.1) 0%, rgba(99,102,241,0.08) 100%)",
          borderColor: "rgba(0,229,199,0.15)",
        }),
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="start">
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            {title}
          </Typography>
          <Typography
            variant="h5"
            fontWeight={800}
            sx={
              gradient
                ? {
                    background: "linear-gradient(135deg, #00e5c7, #6366f1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }
                : undefined
            }
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box sx={{ color: "#00967d", opacity: 0.7 }}>{icon}</Box>
        )}
      </Box>
    </Box>
  );
}
