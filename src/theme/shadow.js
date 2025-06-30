// src/theme/shadows.js

import { Platform } from "react-native";

const shadows = {
  // 🌫 Subtle elevation for small elements
  shadow1: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 1,
    },
  }),

  // 🌫 Standard elevation for buttons
  shadow2: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),

  // 🌫 Elevated cards
  shadow3: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),

  // 🌫 Glassmorphic panels
  shadowGlass: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
    },
    android: {
      elevation: 8,
    },
  }),

  // 🌫 Hero sections or overlays
  shadowHero: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
  }),

  // 🌟 Neon glow effect (blue)
  shadowNeon: Platform.select({
    ios: {
      shadowColor: "#00FFFF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
    },
    android: {
      elevation: 0, // For colored glows on Android, consider a custom lib
    },
  }),
};

export default shadows;
