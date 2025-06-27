// src/theme/typography.js
import { Dimensions, PixelRatio } from "react-native";

const { width } = Dimensions.get("window");
const guidelineBaseWidth = 375;

const scale = (size) => {
  const newSize = (width / guidelineBaseWidth) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

const typography = {
  fontFamily: "System",

  heading1: {
    fontSize: scale(28),
    fontWeight: "700",
    lineHeight: scale(36),
  },
  heading2: {
    fontSize: scale(24),
    fontWeight: "700",
    lineHeight: scale(32),
  },
  heading3: {
    fontSize: scale(20),
    fontWeight: "600",
    lineHeight: scale(28),
  },
  heading4: {
    fontSize: scale(18),
    fontWeight: "600",
    lineHeight: scale(26),
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
};

export default typography;
