import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, Animated } from "react-native";

import useBounceXP from "../animations/bounceXP";
import { useTier } from "../context/TierContext";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const XPProgress = ({ xp, level, xpToNext }) => {
  const percent = Math.min((xp / xpToNext) * 100, 100);
  const { scale, triggerBounce } = useBounceXP();
  const { tier } = useTier();

  useEffect(() => {
    triggerBounce();
  }, [xp, triggerBounce]); // ✅ FIXED: added missing dependency

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <Text style={styles.levelText}>
        {i18n.t("dashboard.level")} {level} ({tier})
      </Text>

      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: `${percent}%`,
              transform: [{ scaleY: scale }],
            },
          ]}
        />
      </View>

      <Animated.Text
        style={[styles.xpText, { transform: [{ scale }] }]}
        accessibilityLabel={`XP progress: ${xp} out of ${xpToNext}`}
      >
        {xp} XP / {xpToNext}
      </Animated.Text>
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
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.borderRadius,
    marginTop: spacing.xs,
  },
  levelText: {
    ...typography.smallBold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  barBackground: {
    width: "100%",
    height: 12,
    backgroundColor: colors.border,
    borderRadius: spacing.xs,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
  },
  xpText: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "right",
  },
});

export default XPProgress;
