import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

import { useTier } from "../context/TierContext";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

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
        <Text style={styles.tierText}>{tier}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lottieWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: 100,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  overlayText: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  levelText: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  xpText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  tierBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tierText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
  },
});

export default XPProgress;
