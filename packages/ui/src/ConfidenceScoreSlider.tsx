"use client";

import { Box, Slider, Typography } from "@mui/material";

interface ConfidenceScoreSliderProps {
  value: number;
  onChange: (value: number) => void;
}

function confidenceColor(score: number): string {
  if (score >= 7) return "#2E7D32";
  if (score >= 4) return "#ED6C02";
  return "#D32F2F";
}

export function ConfidenceScoreSlider({ value, onChange }: ConfidenceScoreSliderProps) {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Confidence in your body
        </Typography>
        <Typography variant="h4" fontWeight={700} sx={{ color: confidenceColor(value) }}>
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
        sx={{ color: confidenceColor(value) }}
      />
      <Box display="flex" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          Very hesitant
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Fully confident
        </Typography>
      </Box>
    </Box>
  );
}
