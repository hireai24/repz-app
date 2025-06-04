import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PropTypes from "prop-types";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const MealPlanCard = ({ meal, index }) => {
  if (!meal) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.index}>Meal {index + 1}</Text>
      <Text style={styles.name}>{meal.name}</Text>
      {meal.description ? (
        <Text style={styles.description}>{meal.description}</Text>
      ) : null}
      {meal.calories ? (
        <Text style={styles.calories}>Calories: {meal.calories}</Text>
      ) : null}
      {meal.macros && (
        <View style={styles.macrosContainer}>
          <Text style={styles.macro}>Protein: {meal.macros.protein}g</Text>
          <Text style={styles.macro}>Carbs: {meal.macros.carbs}g</Text>
          <Text style={styles.macro}>Fats: {meal.macros.fats}g</Text>
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
  calories: {
    ...typography.subtext,
    color: colors.textPrimary,
    fontStyle: "italic",
    marginBottom: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  index: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  macro: {
    ...typography.subtext,
    color: colors.textDark,
  },
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    ...typography.h5,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
});

export default MealPlanCard;
