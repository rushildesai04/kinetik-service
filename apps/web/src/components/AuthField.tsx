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
          color: "#64748b",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        {label}
        {required && (
          <Box component="span" sx={{ color: "#00967d", ml: 0.25 }}>
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
          bgcolor: "rgba(15,23,42,0.02)",
          border: "1px solid rgba(15,23,42,0.1)",
          color: "#0f172a",
          fontSize: "1rem",
          transition: "border-color 0.2s, box-shadow 0.2s",
          "&:hover": {
            borderColor: "rgba(0,184,154,0.4)",
          },
          "&.Mui-focused": {
            borderColor: "#00967d",
            boxShadow: "0 0 0 3px rgba(0,184,154,0.12)",
          },
          "& input::placeholder": {
            color: "#94a3b8",
            opacity: 1,
          },
          "& input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 100px #ffffff inset",
            WebkitTextFillColor: "#0f172a",
            caretColor: "#0f172a",
            borderRadius: "12px",
          },
        }}
      />
    </Box>
  );
}
