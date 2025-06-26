import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Base guideline sizes for scaling
const guidelineBaseWidth = 375; // iPhone 11/12 width
const guidelineBaseHeight = 812; // iPhone 11/12 height

const scale = (size) => (width / guidelineBaseWidth) * size;
const verticalScale = (size) => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

const spacing = {
  // Core scale
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48), // Slight tweak: 40 → 48 (more natural jump from xl)

  // Layout-specific
  screenPadding: moderateScale(20),
  cardPadding: moderateScale(16),
  elementGap: moderateScale(12),
  listItemSpacing: moderateScale(12),

  // Border Radius
  borderRadius: moderateScale(8),
  borderRadiusLarge: moderateScale(16),
  borderRadiusXL: moderateScale(24),

  // Component Heights
  buttonHeight: verticalScale(48),
  inputHeight: verticalScale(44),
  headerHeight: verticalScale(56),
};

export default spacing;
