import { createTheme } from "@mui/material/styles";
import { gradients, glass } from "./design";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#00b89a", light: "#5eead4", dark: "#00967d" },
    secondary: { main: "#6366f1", light: "#818cf8", dark: "#4f46e5" },
    success: { main: "#10b981" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    info: { main: "#0891b2" },
    background: { default: "#f6f8fb", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#64748b" },
    divider: glass.border,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    overline: { letterSpacing: "0.12em", fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f6f8fb" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 12,
        },
        contained: {
          background: gradients.primary,
          boxShadow: "0 4px 24px rgba(0, 229, 199, 0.25)",
          "&:hover": {
            background: gradients.primary,
            boxShadow: "0 6px 32px rgba(0, 229, 199, 0.35)",
          },
        },
        outlined: {
          borderColor: glass.borderAccent,
          color: "#00967d",
          "&:hover": {
            borderColor: "#00967d",
            background: "rgba(0, 184, 154, 0.08)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: glass.bg,
          backdropFilter: "blur(20px)",
          border: `1px solid ${glass.border}`,
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        filled: {
          background: "rgba(0, 184, 154, 0.12)",
          color: "#00967d",
        },
        outlined: {
          borderColor: glass.border,
          color: "#94a3b8",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            background: "rgba(15,23,42,0.02)",
            borderRadius: 12,
            "& fieldset": { borderColor: glass.border },
            "&:hover fieldset": { borderColor: "rgba(0,184,154,0.4)" },
            "&.Mui-focused fieldset": { borderColor: "#00967d" },
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: "#00967d" },
        thumb: {
          boxShadow: "0 0 12px rgba(0,229,199,0.4)",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "rgba(15,23,42,0.08)",
        },
        bar: {
          borderRadius: 8,
          background: gradients.primary,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#94a3b8",
          "&.Mui-checked": { color: "#00967d" },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: { background: "transparent" },
      },
    },
  },
});
