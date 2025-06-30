// src/components/ChallengeTypeSelector.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import LinearGradient from "react-native-linear-gradient";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

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
      {TYPES.map((type) =>
        selectedType === type.key ? (
          <LinearGradient
            key={type.key}
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chip, styles.chipSelected]}
          >
            <TouchableOpacity
              onPress={() => onSelect(type.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: true }}
              accessibilityLabel={`Selected ${type.label} challenge type`}
            >
              <Text style={styles.chipTextSelected}>{type.label}</Text>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          <TouchableOpacity
            key={type.key}
            style={styles.chip}
            onPress={() => onSelect(type.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: false }}
            accessibilityLabel={`Select ${type.label} challenge type`}
          >
            <Text style={styles.chipText}>{type.label}</Text>
          </TouchableOpacity>
        )
      )}
    </View>
  </View>
);

ChallengeTypeSelector.propTypes = {
  selectedType: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.spacing6,
  },
  label: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: spacing.spacing2,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.spacing2,
  },
  chip: {
    backgroundColor: colors.glassBackground,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.spacing2,
    paddingHorizontal: spacing.spacing4,
  },
  chipSelected: {
    ...shadows.shadow2,
  },
  chipText: {
    ...typography.small,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
  },
});

export default ChallengeTypeSelector;
