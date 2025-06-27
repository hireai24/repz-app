import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const TYPES = [
  { key: "reps", label: "Max Reps" },
  { key: "weight", label: "Heaviest Lift" },
  { key: "volume", label: "Total Volume" },
  { key: "timed", label: "Time Trial" },
  { key: "form", label: "Best Form (AI)" },
];

const ChallengeTypeSelector = ({ selectedType, onSelect }) => (
  <View style={styles.container}>
    <Text style={styles.label}>Challenge Type</Text>
    <View style={styles.optionsRow}>
      {TYPES.map((type) => (
        <TouchableOpacity
          key={type.key}
          style={[
            styles.chip,
            selectedType === type.key && styles.chipSelected,
          ]}
          onPress={() => onSelect(type.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedType === type.key }}
          accessibilityLabel={`Select ${type.label} challenge type`}
        >
          <Text
            style={
              selectedType === type.key
                ? styles.chipTextSelected
                : styles.chipText
            }
          >
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

ChallengeTypeSelector.propTypes = {
  selectedType: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ChallengeTypeSelector;
