"use client";

import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const colors = {
  primary: "#0F172A",
  secondary: "#64748B",
  background: "#F8FAFC",
  paper: "#FFFFFF",
  textPrimary: "#1E293B",
  border: "#E2E8F0",
};

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: colors.secondary,
    },
    background: {
      default: colors.background,
      paper: colors.paper,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.secondary,
    },
    divider: colors.border,
  },
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: { fontWeight: 600, color: colors.primary, letterSpacing: "-0.02em" },
    h2: { fontWeight: 600, color: colors.primary, letterSpacing: "-0.01em" },
    h3: { fontWeight: 600, color: colors.primary },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            backgroundColor: colors.primary,
            color: "#FFFFFF",
          },
        },
        outlined: {
          borderColor: "#CBD5E1",
          color: colors.primary,
          "&:hover": {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            color: "#FFFFFF",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
          border: `1px solid ${colors.border}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "#CBD5E1",
            },
            "&:hover fieldset": {
              borderColor: "#94A3B8",
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.primary,
              borderWidth: "1px",
            },
          },
        },
      },
    },
  },
});
