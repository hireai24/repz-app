// src/theme/shadows.js
import { Platform } from "react-native";

const shadows = {
  elevation1: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }),
  elevation2: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }),
  elevation3: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    android: {
      elevation: 3,
    },
  }),
  elevation4: Platform.select({
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
};

export default shadows;
