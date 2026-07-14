"use client";

import { Box, Typography, IconButton, LinearProgress } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface SessionCardProps {
  title: string;
  duration?: string;
  schedule?: string;
  progress?: number;
  accentColor?: string;
  onStart?: () => void;
  dark?: boolean;
}

export function SessionCard({
  title,
  duration = "12 min",
  schedule = "Today",
  progress,
  accentColor = "#00e5c7",
  onStart,
  dark = true,
}: SessionCardProps) {
  return (
    <Box
      sx={{
        borderRadius: "20px",
        p: 2.5,
        background: dark
          ? "linear-gradient(145deg, #0f172a 0%, #0a0f1a 100%)"
          : "rgba(255,255,255,0.04)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.08)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box flex={1} minWidth={0}>
        <Typography
          variant="overline"
          sx={{ color: accentColor, fontSize: "0.65rem", letterSpacing: "0.1em" }}
        >
          Next Session
        </Typography>
        <Typography variant="h6" fontWeight={700} noWrap sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {duration}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {schedule}
            </Typography>
          </Box>
        </Box>
        {progress !== undefined && (
          <Box mt={1.5}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 4, borderRadius: 2 }}
            />
            <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
              {progress}% complete this week
            </Typography>
          </Box>
        )}
      </Box>
      <IconButton
        onClick={onStart}
        sx={{
          width: 56,
          height: 56,
          background: `linear-gradient(135deg, ${accentColor}, #6366f1)`,
          color: "#060a12",
          boxShadow: `0 4px 20px ${accentColor}40`,
          "&:hover": {
            background: `linear-gradient(135deg, ${accentColor}, #6366f1)`,
            transform: "scale(1.05)",
          },
        }}
      >
        <PlayArrowIcon />
      </IconButton>
    </Box>
  );
}
