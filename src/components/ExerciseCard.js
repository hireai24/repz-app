// src/components/ExerciseCard.js
import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadow";

const fallbackIcon = "https://via.placeholder.com/40x40.png?text=EX";

const ExerciseCard = ({ exercise, onAdd }) => {
  return (
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
      <View style={styles.addBtn}>
        <Text style={styles.addText}>+</Text>
      </View>
    </TouchableOpacity>
  );
};

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
    borderRadius: spacing.radiusLg,
    padding: spacing.md,
    marginRight: spacing.md,
    minWidth: 220,
    ...shadows.elevationCard,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: spacing.radiusMd,
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusPill,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    marginTop: -2,
  },
});

export default ExerciseCard;
