// src/components/DailyChallengeCard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";
import i18n from "../locales/i18n";

const DailyChallengeCard = ({ challenge, onComplete }) => {
  const { title, description, completed } = challenge; // Destructure 'title' instead of 'type', 'value'

  return (
    <View style={[styles.card, completed && styles.completedCard]}>
      <Text style={styles.title}>
        {title || i18n.t("dailyChallenge.defaultTitle")}
      </Text> {/* Use challenge.title, provide a default translation key */}
      <Text style={styles.desc}>
        {description || i18n.t("dailyChallenge.defaultDescription")}
      </Text> {/* Use challenge.description, provide a default translation key */}

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
    title: PropTypes.string, // Now expecting a title
    description: PropTypes.string,
    type: PropTypes.string.isRequired, // Still useful for internal logic/tracking
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Still useful for internal logic/tracking
    completed: PropTypes.bool,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  completedCard: {
    backgroundColor: colors.successBackground,
  },
  completedText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "bold",
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
});

export default DailyChallengeCard;