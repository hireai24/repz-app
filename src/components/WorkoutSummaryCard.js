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

      <View style={styles.row}>
        <Ionicons name="flash-outline" size={20} color={colors.success} />
        <Text style={styles.label}>XP Earned:</Text>
        <Text style={[styles.value, { transform: [{ scale }] }]}>
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
        >
          <Ionicons name="sparkles-outline" size={18} color={colors.white} />
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
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  shareText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },
  adaptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  adaptText: {
    color: colors.white,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },
});

export default WorkoutSummaryCard;
