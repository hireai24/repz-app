// src/theme/colors.js

const darkColors = {
  background: "#0E0E0E",
  surface: "#151515",
  card: "rgba(255, 255, 255, 0.03)",

  textPrimary: "#FFFFFF",
  textSecondary: "#A9A9A9",
  textTertiary: "#777777",
  textOnPrimary: "#FFFFFF",

  white: "#FFFFFF",
  black: "#000000",
  gray: "#999999",
  gold: "#FFD700",

  // Neon-inspired accent colors
  primary: "#00FFFF", // Neon Blue
  secondary: "#9A00FF", // Neon Purple
  success: "#43AA8B",
  warning: "#FF9F1C",
  danger: "#EF476F",

  successBackground: "#153f2f",
  inputBackground: "#1F1F1F",

  accentBlue: "#00BFFF",
  accentPurple: "#A020F0",
  accentPink: "#FF69B4",
  streakGlow: "#F77F00",

  disabled: "#333333",
  border: "#444444",

  // Tiers
  free: "#555555",
  pro: "#00FFFF",
  elite: "#9A00FF",

  // Overlays and Glassmorphism
  overlayDark: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(255, 255, 255, 0.05)",
  glassBackground: "rgba(255, 255, 255, 0.04)",
  cardBackground: "rgba(255, 255, 255, 0.03)",

  // Gradients
  gradientStart: "#00FFFF",
  gradientEnd: "#9A00FF",

  statusColors: {
    success: "#43AA8B",
    error: "#EF476F",
    warning: "#FF9F1C",
  },
};

const lightColors = {
  background: "#FFFFFF",
  surface: "#F4F4F4",
  card: "rgba(0, 0, 0, 0.05)",

  textPrimary: "#000000",
  textSecondary: "#444444",
  textTertiary: "#777777",
  textOnPrimary: "#FFFFFF",

  white: "#FFFFFF",
  black: "#000000",
  gray: "#555555",
  gold: "#FFD700",

  primary: "#00BFFF",
  secondary: "#A020F0",
  success: "#2A9D8F",
  warning: "#F4A261",
  danger: "#E76F51",

  successBackground: "#DCF5ED",
  inputBackground: "#f4f4f4",

  accentBlue: "#00BFFF",
  accentPurple: "#A020F0",
  accentPink: "#FF69B4",
  streakGlow: "#F77F00",

  disabled: "#CCCCCC",
  border: "#DDDDDD",

  free: "#888888",
  pro: "#00BFFF",
  elite: "#A020F0",

  overlayDark: "rgba(0, 0, 0, 0.1)",
  overlayLight: "rgba(255, 255, 255, 0.6)",
  glassBackground: "rgba(255, 255, 255, 0.6)",
  cardBackground: "rgba(255, 255, 255, 0.8)",

  gradientStart: "#00BFFF",
  gradientEnd: "#A020F0",

  statusColors: {
    success: "#2A9D8F",
    error: "#E76F51",
    warning: "#F4A261",
  },
};

const colors = {
  dark: darkColors,
  light: lightColors,
  ...darkColors, // default fallback to dark mode
};

export default colors;
