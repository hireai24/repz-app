// src/components/UserPlanCard.js

import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

const UserPlanCard = ({ plan, onPress, onDelete }) => {
  const formattedDate = format(new Date(plan.createdAt), "dd MMM yyyy");

  const confirmDelete = () => {
    Alert.alert(
      "Delete Plan",
      `Are you sure you want to delete "${plan.name}"?\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(plan.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open plan ${plan.name}`}
      testID={`user-plan-${plan.name.toLowerCase().replace(/\s+/g, "-")}`}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{plan.name}</Text>
        <TouchableOpacity
          onPress={confirmDelete}
          style={styles.deleteBtn}
          accessibilityRole="button"
          accessibilityLabel={`Delete plan ${plan.name}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{plan.type?.toUpperCase() || "CUSTOM"}</Text>
        </View>
        <Text style={styles.exercises}>
          {plan.exercises?.length || 0} Exercises
        </Text>
      </View>

      <View style={styles.meta}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={colors.accentBlue}
        />
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

UserPlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    exercises: PropTypes.array,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusLg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    ...shadows.shadow3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.heading3,
    color: colors.textPrimary,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.accentBlue,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
  exercises: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
});

export default UserPlanCard;
