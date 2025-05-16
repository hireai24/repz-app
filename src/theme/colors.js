const darkColors = {
  background: "#0E0E0E",
  surface: "#1A1A1A",
  card: "#151515",

  textPrimary: "#FFFFFF",
  textSecondary: "#A9A9A9",

  white: "#FFFFFF",
  gray: "#CCCCCC",

  primary: "#E63946",
  secondary: "#FFD166",
  success: "#43AA8B",
  warning: "#FF9F1C",
  danger: "#EF476F",

  accentBlue: "#118AB2",
  streakGlow: "#F77F00",

  disabled: "#333333",
  border: "#444444",

  free: "#666666",
  pro: "#FFD700",
  elite: "#DA70D6",

  overlayDark: "rgba(0, 0, 0, 0.6)",
  overlayLight: "rgba(255, 255, 255, 0.05)",

  statusColors: {
    success: "#43AA8B",
    error: "#EF476F",
    warning: "#FF9F1C",
  },
};

const lightColors = {
  background: "#FFFFFF",
  surface: "#F4F4F4",
  card: "#EFEFEF",

  textPrimary: "#000000",
  textSecondary: "#444444",

  white: "#FFFFFF",
  gray: "#555555",

  primary: "#E63946",
  secondary: "#FFD166",
  success: "#2A9D8F",
  warning: "#F4A261",
  danger: "#E76F51",

  accentBlue: "#118AB2",
  streakGlow: "#F77F00",

  disabled: "#CCCCCC",
  border: "#DDDDDD",

  free: "#888888",
  pro: "#FFC300",
  elite: "#BA55D3",

  overlayDark: "rgba(0, 0, 0, 0.1)",
  overlayLight: "rgba(255, 255, 255, 0.4)",

  statusColors: {
    success: "#2A9D8F",
    error: "#E76F51",
    warning: "#F4A261",
  },
};

const colors = {
  dark: darkColors,
  light: lightColors,
  ...darkColors, // fallback default is dark
};

export default colors;
