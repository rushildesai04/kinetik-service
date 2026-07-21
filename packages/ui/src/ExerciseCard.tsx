"use client";

import { Box, Typography, Button, Chip } from "@mui/material";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

interface ExerciseCardProps {
  name: string;
  description: string;
  bodyRegion: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  videoUrl?: string;
  isCompleted?: boolean;
  progress?: number;
  phase?: string;
  onStart?: () => void;
  onComplete?: () => void;
}

export function ExerciseCard({
  name,
  description,
  bodyRegion,
  sets,
  reps,
  holdSeconds,
  isCompleted,
  progress,
  phase,
  onStart,
  onComplete,
}: ExerciseCardProps) {
  const accentColors = ["#00e5c7", "#22d3ee", "#6366f1", "#f59e0b"];
  const accent = accentColors[name.length % accentColors.length];

  return (
    <Box
      className="glass-card"
      sx={{
        p: 0,
        overflow: "hidden",
        opacity: isCompleted ? 0.75 : 1,
        transition: "transform 0.2s, border-color 0.2s",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Box display="flex" gap={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${accent}18`,
              color: accent,
              flexShrink: 0,
            }}
          >
            {isCompleted ? <CheckCircleIcon /> : <FitnessCenterIcon />}
          </Box>
          <Box flex={1} minWidth={0}>
            <Box display="flex" justifyContent="space-between" alignItems="start" mb={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                {name}
              </Typography>
              {onStart && !isCompleted && (
                <Button
                  size="small"
                  onClick={onStart}
                  sx={{
                    minWidth: 40,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    p: 0,
                    background: `linear-gradient(135deg, ${accent}, #6366f1)`,
                    color: "#060a12",
                    "&:hover": { background: `linear-gradient(135deg, ${accent}, #6366f1)` },
                  }}
                >
                  <PlayCircleOutlineIcon />
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              {bodyRegion}
              {phase ? ` · ${phase}` : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ lineHeight: 1.5 }}>
              {description}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
              <Chip
                label={`${sets}×${reps}${holdSeconds ? ` · ${holdSeconds}s hold` : ""}`}
                size="small"
                sx={{ bgcolor: "rgba(15,23,42,0.06)", color: "text.secondary", fontSize: "0.7rem" }}
              />
              {isCompleted && (
                <Chip label="Done today" size="small" sx={{ bgcolor: "#10b98120", color: "#10b981" }} />
              )}
            </Box>
            {progress !== undefined && (
              <Box mt={1.5}>
                <Box
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "rgba(15,23,42,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${accent}, #6366f1)`,
                      borderRadius: 2,
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                  {progress}% complete this week
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        {!isCompleted && onComplete && (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={onComplete}
            sx={{ mt: 2, borderColor: "rgba(15,23,42,0.15)" }}
          >
            Log as complete
          </Button>
        )}
      </Box>
    </Box>
  );
}
