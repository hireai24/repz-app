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

const ChallengeTypeSelector = ({ selectedType, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Challenge Type</Text>
      <View style={styles.options}>
        {TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.option,
              selectedType === type.key && styles.selected,
            ]}
            onPress={() => onSelect(type.key)}
          >
            <Text
              style={[
                styles.optionText,
                selectedType === type.key && styles.optionTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

ChallengeTypeSelector.propTypes = {
  selectedType: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  label: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    margin: spacing.xs,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ChallengeTypeSelector;
