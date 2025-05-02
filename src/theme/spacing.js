// src/theme/spacing.js

const spacing = {
  // Core scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48, // Slight tweak: 40 → 48 (more natural jump from xl)

  // Layout-specific
  screenPadding: 20,
  cardPadding: 16,
  elementGap: 12,
  listItemSpacing: 12, // ✅ added (good for FlatLists, consistency)

  // Border Radius
  borderRadius: 8,
  borderRadiusLarge: 16,
  borderRadiusXL: 24, // ✅ added (future-proof for modals/cards)

  // Component Heights
  buttonHeight: 48,
  inputHeight: 44,
  headerHeight: 56, // ✅ added (often needed for custom headers)
};

export default spacing;
