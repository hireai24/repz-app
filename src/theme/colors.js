// src/theme/colors.js

const colors = {
  background: '#0E0E0E',
  surface: '#1A1A1A',
  card: '#151515',

  textPrimary: '#FFFFFF',
  textSecondary: '#A9A9A9', // Updated for better contrast (WCAG AA)

  primary: '#E63946',       // REPZ Red (buttons, CTAs)
  secondary: '#FFD166',     // XP Yellow
  success: '#43AA8B',        // Good form / completed status
  warning: '#FF9F1C',
  danger: '#EF476F',

  accentBlue: '#118AB2',
  streakGlow: '#F77F00',

  disabled: '#333333',
  border: '#444444', // Improved contrast

  // Tier-specific colors
  free: '#666666',
  pro: '#FFD700',
  elite: '#DA70D6',

  // Transparent overlays
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(255, 255, 255, 0.05)',

  // ✅ Added statusColors for consistency
  statusColors: {
    success: '#43AA8B',
    error: '#EF476F',
    warning: '#FF9F1C',
  },
};

export default colors;
