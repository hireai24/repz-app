import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const MealPlanCard = ({ meal, index }) => {
  if (!meal) return null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.index}>
        {`🍽️ Meal ${index + 1}`}
      </Text>

      <Text style={styles.name} accessibilityRole="header">
        {meal.name}
      </Text>

      {meal.description && (
        <Text style={styles.description}>{meal.description}</Text>
      )}

      {meal.calories && (
        <Text style={styles.calories}>
          {`🔥 ${meal.calories} kcal`}
        </Text>
      )}

      {meal.macros && (
        <View style={styles.macrosContainer}>
          <Text style={styles.macro}>
            {`Protein: ${meal.macros.protein}g`}
          </Text>
          <Text style={styles.macro}>
            {`Carbs: ${meal.macros.carbs}g`}
          </Text>
          <Text style={styles.macro}>
            {`Fats: ${meal.macros.fats}g`}
          </Text>
        </View>
      )}
    </View>
  );
};

MealPlanCard.propTypes = {
  meal: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    calories: PropTypes.number,
    macros: PropTypes.shape({
      protein: PropTypes.number,
      carbs: PropTypes.number,
      fats: PropTypes.number,
    }),
  }).isRequired,
  index: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.lg,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  index: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  calories: {
    ...typography.subtext,
    color: colors.textPrimary,
    fontStyle: "italic",
    marginBottom: spacing.xs,
  },
  macrosContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.sm,
  },
  macro: {
    ...typography.subtext,
    color: colors.textDark,
  },
});

export default MealPlanCard;
