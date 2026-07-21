"use client";

import { Box, Typography } from "@mui/material";

interface RadarMetric {
  label: string;
  value: number;
}

interface RecoveryRadarProps {
  metrics: RadarMetric[];
  title?: string;
  subtitle?: string;
}

export function RecoveryRadar({
  metrics,
  title = "Recovery Profile",
  subtitle = "5-axis snapshot vs your baseline",
}: RecoveryRadarProps) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 80;
  const levels = 4;

  const angleStep = (2 * Math.PI) / metrics.length;
  const startAngle = -Math.PI / 2;

  function pointAt(index: number, value: number): [number, number] {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * maxRadius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  const dataPoints = metrics.map((m, i) => pointAt(i, m.value));
  const polygon = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <Box className="glass-card" sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        {subtitle}
      </Typography>
      <Box display="flex" justifyContent="center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {Array.from({ length: levels }, (_, l) => {
            const r = ((l + 1) / levels) * maxRadius;
            const pts = metrics
              .map((_, i) => {
                const angle = startAngle + i * angleStep;
                return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
              })
              .join(" ");
            return (
              <polygon
                key={l}
                points={pts}
                fill="none"
                stroke="rgba(15,23,42,0.1)"
                strokeWidth={1}
              />
            );
          })}
          {metrics.map((_, i) => {
            const [x, y] = pointAt(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(15,23,42,0.08)"
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={polygon}
            fill="url(#radarGradient)"
            fillOpacity={0.35}
            stroke="#00e5c7"
            strokeWidth={2}
          />
          {dataPoints.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4} fill="#00e5c7" />
          ))}
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e5c7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </Box>
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mt={2}>
        {metrics.map((m) => (
          <Box key={m.label} display="flex" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {m.label}
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary">
              {Math.round(m.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
