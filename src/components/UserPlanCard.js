import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

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
        <Text style={styles.type}>{plan.type || "Custom Plan"}</Text>
        <Text style={styles.exercises}>
          {plan.exercises?.length || 0} Exercises
        </Text>
      </View>

      <View style={styles.meta}>
        <Ionicons
          name="calendar-outline"
          size={16}
          color={colors.textSecondary}
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
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.heading4,
    color: colors.textPrimary,
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  details: {
    marginBottom: spacing.sm,
  },
  type: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 2,
  },
  exercises: {
    color: colors.textSecondary,
    fontSize: 13,
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
