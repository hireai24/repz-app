// src/components/XPProgress.js

import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

import { useTier } from "../context/TierContext";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadow";

const XPProgress = ({ xp, level, xpToNext }) => {
  const progress = Math.min(xp / xpToNext, 1);
  const lottieRef = useRef();
  const { tier } = useTier();

  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.play(0, 60);
    }
  }, [xp]);

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <View style={styles.lottieWrapper}>
        <View style={styles.glow} />
        <LottieView
          ref={lottieRef}
          source={require("../assets/xp/xp-ring.json")}
          autoPlay
          loop
          style={styles.lottie}
          progress={progress}
        />
        <View style={styles.overlayText}>
          <Text style={styles.levelText}>
            {i18n.t("dashboard.level")} {level}
          </Text>
          <Text style={styles.xpText}>
            {xp}/{xpToNext}
          </Text>
        </View>
      </View>
      <View style={styles.tierBadge}>
        <Text style={styles.tierText}>{tier.toUpperCase()}</Text>
      </View>
    </View>
  );
};

XPProgress.propTypes = {
  xp: PropTypes.number.isRequired,
  level: PropTypes.number.isRequired,
  xpToNext: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusLg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.elevationGlass,
  },
  lottieWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 140,
    height: 140,
    position: "relative",
  },
  lottie: {
    width: 140,
    height: 140,
  },
  glow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 80,
    backgroundColor: colors.accentBlue,
    opacity: 0.1,
  },
  overlayText: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  levelText: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  xpText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusPill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    ...shadows.elevation2,
  },
  tierText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    textTransform: "uppercase",
  },
});

export default XPProgress;
