"use client";

import { Box, Slider, Typography } from "@mui/material";

interface PainScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

function painColor(score: number): string {
  if (score <= 3) return "#2E7D32";
  if (score <= 6) return "#ED6C02";
  return "#D32F2F";
}

export function PainScoreSlider({ value, onChange, label = "Pain Level" }: PainScoreSliderProps) {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ color: painColor(value) }}>
          {value}
          <Typography component="span" variant="body2" color="text.secondary">
            /10
          </Typography>
        </Typography>
      </Box>
      <Slider
        value={value}
        onChange={(_, v) => onChange(v as number)}
        min={0}
        max={10}
        step={1}
        marks
        valueLabelDisplay="auto"
        sx={{
          color: painColor(value),
          "& .MuiSlider-markLabel": { fontSize: "0.7rem" },
        }}
      />
      <Box display="flex" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          No pain
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Worst pain
        </Typography>
      </Box>
    </Box>
  );
}
