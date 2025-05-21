// src/components/DailyChallengeCard.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";
import i18n from "../locales/i18n";

const DailyChallengeCard = ({ challenge, onComplete }) => {
  const { type, value, description, completed } = challenge;

  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <Text style={styles.title}>{i18n.t("challengeWager.title")}</Text>
      <Text style={styles.desc}>{description || `${type}: ${value}`}</Text>

      {completed ? (
        <Text style={styles.completedText}>{i18n.t("common.confirm")}</Text>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={onComplete}
          accessibilityRole="button"
          accessibilityLabel="Complete daily challenge"
        >
          <Text style={styles.buttonText}>{i18n.t("common.submit")}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

DailyChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    description: PropTypes.string,
    completed: PropTypes.bool,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  completedCard: {
    backgroundColor: colors.successBackground || "#153f2f",
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  completedText: {
    color: colors.success,
    fontWeight: "bold",
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default DailyChallengeCard;
