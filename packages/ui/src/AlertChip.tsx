"use client";

import { Chip } from "@mui/material";

interface AlertChipProps {
  type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

const severityColor = {
  INFO: "info" as const,
  WARNING: "warning" as const,
  CRITICAL: "error" as const,
};

const typeLabels: Record<string, string> = {
  MISSED_SESSIONS: "Missed Sessions",
  HIGH_PAIN: "High Pain",
  LOW_ADHERENCE: "Low Adherence",
  FORM_DEGRADATION: "Form Issue",
  READINESS_MILESTONE: "Milestone",
  SURVEY_DUE: "Survey Due",
};

export function AlertChip({ type, severity }: AlertChipProps) {
  return (
    <Chip
      label={typeLabels[type] ?? type}
      color={severityColor[severity]}
      size="small"
      variant={severity === "CRITICAL" ? "filled" : "outlined"}
    />
  );
}
