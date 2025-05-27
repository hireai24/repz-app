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
  }, [xpEarned, triggerBounce]); // ✅ FIXED: added missing dependency

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>Workout Complete</Text>

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
        <Ionicons
          name="calendar-outline"
          size={20}
          color={colors.textSecondary}
        />
        <Text style={styles.label}>Streak:</Text>
        <Text style={styles.value}>{streakDays} days</Text>
      </View>

      <View style={styles.row}>
        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color={colors.textSecondary}
        />
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
          <Text style={styles.adaptText}>Use AI to Adapt Next Session</Text>
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
  actions: {
    gap: 10,
    marginTop: spacing.md,
  },
  adaptBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: spacing.borderRadius,
    padding: spacing.md,
  },
  adaptText: {
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  shareBtn: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadius,
    padding: spacing.md,
  },
  shareText: {
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default WorkoutSummaryCard;
