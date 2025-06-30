// src/components/MealPlanCard.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import LinearGradient from "react-native-linear-gradient";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

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
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.macrosContainer}
        >
          <Text style={styles.macro}>
            {`Protein: ${meal.macros.protein}g`}
          </Text>
          <Text style={styles.macro}>
            {`Carbs: ${meal.macros.carbs}g`}
          </Text>
          <Text style={styles.macro}>
            {`Fats: ${meal.macros.fats}g`}
          </Text>
        </LinearGradient>
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
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    marginBottom: spacing.spacing5,
    padding: spacing.spacing4,
    ...shadows.shadow3,
  },
  index: {
    ...typography.bodyBold,
    color: colors.accentBlue,
    marginBottom: spacing.spacing1,
    fontSize: 16,
  },
  name: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.spacing1,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.spacing2,
  },
  calories: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontStyle: "italic",
    marginBottom: spacing.spacing2,
  },
  macrosContainer: {
    borderRadius: spacing.radiusLg,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.spacing2,
    paddingHorizontal: spacing.spacing3,
  },
  macro: {
    ...typography.caption,
    color: colors.textOnPrimary,
  },
});

export default MealPlanCard;
