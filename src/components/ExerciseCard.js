// src/components/ExerciseCard.js

import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

const fallbackIcon = "https://via.placeholder.com/40x40.png?text=EX";

const ExerciseCard = ({ exercise, onAdd }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onAdd}
    accessibilityRole="button"
    accessibilityLabel={`Add ${exercise.name}`}
    testID={`exercise-card-${exercise.name.toLowerCase().replace(/\s+/g, "-")}`}
    activeOpacity={0.85}
  >
    <Image
      source={{ uri: exercise.icon || fallbackIcon }}
      style={styles.icon}
      accessibilityLabel={`${exercise.name} icon`}
    />
    <View style={styles.details}>
      <Text style={styles.name}>{exercise.name}</Text>
      <Text style={styles.meta}>
        {exercise.category} • {exercise.muscle}
      </Text>
    </View>
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.addBtn}
    >
      <Text style={styles.addText}>+</Text>
    </LinearGradient>
  </TouchableOpacity>
);

ExerciseCard.propTypes = {
  exercise: PropTypes.shape({
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    category: PropTypes.string.isRequired,
    muscle: PropTypes.string.isRequired,
  }).isRequired,
  onAdd: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    padding: spacing.spacing4,
    marginRight: spacing.spacing4,
    minWidth: 240,
    ...shadows.shadow3,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: spacing.radiusLg,
    marginRight: spacing.spacing4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  details: {
    flex: 1,
  },
  name: {
    ...typography.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addBtn: {
    borderRadius: spacing.radiusFull,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.shadow1,
  },
  addText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    marginTop: -1,
  },
});

export default ExerciseCard;
