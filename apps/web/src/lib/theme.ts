import { createTheme } from "@mui/material/styles";
import { gradients, glass } from "./design";

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00e5c7", light: "#5eead4", dark: "#00b89a" },
    secondary: { main: "#6366f1", light: "#818cf8", dark: "#4f46e5" },
    success: { main: "#10b981" },
    warning: { main: "#f59e0b" },
    error: { main: "#ef4444" },
    info: { main: "#22d3ee" },
    background: { default: "#060a12", paper: "rgba(255,255,255,0.04)" },
    text: { primary: "#f1f5f9", secondary: "#94a3b8" },
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
        body: { backgroundColor: "#060a12" },
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
          color: "#00e5c7",
          "&:hover": {
            borderColor: "#00e5c7",
            background: "rgba(0, 229, 199, 0.08)",
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
          background: "rgba(0, 229, 199, 0.15)",
          color: "#00e5c7",
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
            background: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            "& fieldset": { borderColor: glass.border },
            "&:hover fieldset": { borderColor: "rgba(0,229,199,0.3)" },
            "&.Mui-focused fieldset": { borderColor: "#00e5c7" },
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: "#00e5c7" },
        thumb: {
          boxShadow: "0 0 12px rgba(0,229,199,0.5)",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.08)",
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
          color: "#64748b",
          "&.Mui-checked": { color: "#00e5c7" },
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
