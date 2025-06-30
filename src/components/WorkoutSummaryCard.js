// src/components/WorkoutSummaryCard.js

import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useTier } from "../context/TierContext";
import useBounceXP from "../animations/bounceXP";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

const WorkoutSummaryCard = ({
  volume,
  prCount,
  xpEarned,
  streakDays,
  planName,
  planId,
  onShare,
  onAdapt,
}) => {
  const { tier } = useTier();
  const navigation = useNavigation();
  const { scale, triggerBounce } = useBounceXP();

  useEffect(() => {
    if (xpEarned > 0) triggerBounce();
  }, [xpEarned, triggerBounce]);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>🎯 Workout Summary</Text>

      {planName && (
        <View style={styles.row}>
          <Ionicons name="clipboard-outline" size={20} color={colors.warning} />
          <Text style={styles.label}>Plan:</Text>
          <Text style={styles.value}>{planName}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Ionicons name="barbell-outline" size={20} color={colors.secondary} />
        <Text style={styles.label}>Volume:</Text>
        <Text style={styles.value}>{volume.toLocaleString()} kg</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="flame-outline" size={20} color={colors.primary} />
        <Text style={styles.label}>PRs Hit:</Text>
        <Text style={styles.value}>{prCount}</Text>
      </View>

      <View style={[styles.row, styles.xpRow]}>
        <View style={styles.xpGlow} />
        <Ionicons name="flash-outline" size={20} color={colors.success} />
        <Text style={styles.label}>XP Earned:</Text>
        <Text style={[styles.xpValue, { transform: [{ scale }] }]}>
          +{xpEarned}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.label}>Streak:</Text>
        <Text style={styles.value}>{streakDays} days</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.label}>Tier:</Text>
        <Text style={styles.value}>{tier}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onShare || (() => navigation.navigate("FormGhost"))}
          style={styles.shareBtn}
          accessibilityRole="button"
          accessibilityLabel="Share your lift"
          activeOpacity={0.85}
        >
          <Ionicons name="share-social-outline" size={18} color={colors.textOnPrimary} />
          <Text style={styles.shareText}>Share Your Lift</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            onAdapt
              ? onAdapt(planId)
              : navigation.navigate("PlanBuilder", { adaptFrom: planId })
          }
          style={styles.adaptBtn}
          accessibilityRole="button"
          accessibilityLabel="Use AI to adapt your next workout"
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles-outline" size={18} color={colors.textOnPrimary} />
          <Text style={styles.adaptText}>AI Adapt Next Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

WorkoutSummaryCard.propTypes = {
  volume: PropTypes.number.isRequired,
  prCount: PropTypes.number.isRequired,
  xpEarned: PropTypes.number.isRequired,
  streakDays: PropTypes.number.isRequired,
  planName: PropTypes.string,
  planId: PropTypes.string.isRequired,
  onShare: PropTypes.func,
  onAdapt: PropTypes.func,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusLg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    ...shadows.shadow4,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  value: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  xpRow: {
    position: "relative",
  },
  xpGlow: {
    position: "absolute",
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
    borderRadius: spacing.radiusMd,
    backgroundColor: colors.success,
    opacity: 0.05,
  },
  xpValue: {
    ...typography.caption,
    color: colors.success,
    fontWeight: "700",
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
    backgroundColor: colors.accentBlue,
  },
  shareText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    marginLeft: spacing.xs,
  },
  adaptBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: spacing.radiusMd,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
    backgroundColor: colors.primary,
  },
  adaptText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    marginLeft: spacing.xs,
  },
});

export default WorkoutSummaryCard;
