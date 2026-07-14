"use client";

import { Box, Typography, InputBase } from "@mui/material";

interface AuthFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
}

export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  required,
  defaultValue,
}: AuthFieldProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        component="label"
        htmlFor={name}
        variant="caption"
        sx={{
          display: "block",
          mb: 0.75,
          color: "#94a3b8",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: "#00e5c7", ml: 0.25 }}>
            *
          </Box>
        )}
      </Typography>
      <InputBase
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        fullWidth
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: "12px",
          bgcolor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#f1f5f9",
          fontSize: "1rem",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:hover": {
            borderColor: "rgba(0,229,199,0.3)",
          },
          "&.Mui-focused": {
            borderColor: "#00e5c7",
            boxShadow: "0 0 0 3px rgba(0,229,199,0.12)",
          },
          "& input::placeholder": {
            color: "#64748b",
            opacity: 1,
          },
          "& input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 100px #0d1520 inset",
            WebkitTextFillColor: "#f1f5f9",
            caretColor: "#f1f5f9",
            borderRadius: "12px",
          },
        }}
      />
    </Box>
  );
}
