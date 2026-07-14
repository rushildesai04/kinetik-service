"use client";

import { Box, Typography, Avatar, LinearProgress, Badge } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

interface PatientRowProps {
  name: string;
  injuryType: string;
  sport?: string;
  painScore?: number;
  adherenceRate: number;
  readinessScore?: number;
  unreadAlerts: number;
  onClick?: () => void;
}

export function PatientRow({
  name,
  injuryType,
  sport,
  painScore,
  adherenceRate,
  readinessScore,
  unreadAlerts,
  onClick,
}: PatientRowProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      p={2}
      sx={{
        cursor: onClick ? "pointer" : "default",
        borderRadius: 2,
        "&:hover": onClick ? { bgcolor: "action.hover" } : {},
      }}
      onClick={onClick}
    >
      <Badge badgeContent={unreadAlerts} color="error" invisible={unreadAlerts === 0}>
        <Avatar sx={{ bgcolor: "primary.main" }}>{initials}</Avatar>
      </Badge>
      <Box flex={1} minWidth={0}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {injuryType}
          {sport ? ` · ${sport}` : ""}
        </Typography>
      </Box>
      <Box display="flex" gap={3} alignItems="center">
        {painScore !== undefined && (
          <Box textAlign="center" minWidth={48}>
            <Typography variant="caption" color="text.secondary">
              Pain
            </Typography>
            <Typography
              variant="body1"
              fontWeight={700}
              color={painScore > 6 ? "error.main" : painScore > 3 ? "warning.main" : "success.main"}
            >
              {painScore}/10
            </Typography>
          </Box>
        )}
        <Box minWidth={80}>
          <Typography variant="caption" color="text.secondary">
            Adherence {Math.round(adherenceRate)}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={adherenceRate}
            color={adherenceRate >= 70 ? "success" : adherenceRate >= 40 ? "warning" : "error"}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
        {readinessScore !== undefined && (
          <Box textAlign="center" minWidth={48}>
            <Typography variant="caption" color="text.secondary">
              Ready
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {Math.round(readinessScore)}%
            </Typography>
          </Box>
        )}
        {unreadAlerts > 0 && <NotificationsActiveIcon color="error" fontSize="small" />}
      </Box>
    </Box>
  );
}
