"use client";

import { Box, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

interface ProviderNoteProps {
  message: string;
  author: string;
  date: string;
}

export function ProviderNote({ message, author, date }: ProviderNoteProps) {
  return (
    <Box className="glass-card" sx={{ p: 2.5 }}>
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <DescriptionOutlinedIcon sx={{ color: "#00967d", fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Provider note
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", lineHeight: 1.6, mb: 1.5 }}>
        &ldquo;{message}&rdquo;
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {author} · {date}
      </Typography>
    </Box>
  );
}
