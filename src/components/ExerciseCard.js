import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const fallbackIcon = "https://via.placeholder.com/40x40.png?text=EX";

const ExerciseCard = ({ exercise, onAdd }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onAdd}
      accessibilityRole="button"
      accessibilityLabel={`Add ${exercise.name}`}
      testID={`exercise-card-${exercise.name.toLowerCase().replace(/\s+/g, "-")}`}
      activeOpacity={0.8}
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    minWidth: 220,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 8,
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
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: -2,
  },
});

export default ExerciseCard;
