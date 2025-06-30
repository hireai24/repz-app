// src/theme/typography.js

import { Dimensions, PixelRatio, Platform } from "react-native";

const { width } = Dimensions.get("window");
const guidelineBaseWidth = 375;

const scale = (size) => {
  const newSize = (width / guidelineBaseWidth) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const typography = {
  // 🌟 Use a premium, modern font
  fontFamily: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "System",
  }),

  // Hero display heading
  display: {
    fontSize: scale(38),
    fontWeight: "700",
    lineHeight: scale(46),
  },

  heading1: {
    fontSize: scale(30),
    fontWeight: "700",
    lineHeight: scale(38),
  },
  heading2: {
    fontSize: scale(26),
    fontWeight: "700",
    lineHeight: scale(34),
  },
  heading3: {
    fontSize: scale(22),
    fontWeight: "600",
    lineHeight: scale(30),
  },
  heading4: {
    fontSize: scale(20),
    fontWeight: "600",
    lineHeight: scale(28),
  },

  // Added subheading style
  subheading: {
    fontSize: scale(18),
    fontWeight: "500",
    lineHeight: scale(24),
  },

  body: {
    fontSize: scale(16),
    fontWeight: "400",
    lineHeight: scale(24),
  },
  bodyBold: {
    fontSize: scale(16),
    fontWeight: "600",
    lineHeight: scale(24),
  },

  small: {
    fontSize: scale(14),
    fontWeight: "400",
    lineHeight: scale(20),
  },
  smallBold: {
    fontSize: scale(14),
    fontWeight: "600",
    lineHeight: scale(20),
  },

  caption: {
    fontSize: scale(12),
    fontWeight: "400",
    lineHeight: scale(16),
  },

  button: {
    fontSize: scale(16),
    fontWeight: "700",
    lineHeight: scale(22),
    textTransform: "uppercase",
  },

  mono: {
    fontSize: scale(14),
    fontWeight: "400",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
};

export default typography;
