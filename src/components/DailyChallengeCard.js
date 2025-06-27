// src/components/DailyChallengeCard.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";
import i18n from "../locales/i18n";

const DailyChallengeCard = ({ challenge, onComplete }) => {
  const { title, description, completed } = challenge;

  return (
    <View
      style={[
        styles.card,
        completed && styles.completedCard,
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Daily challenge: ${title || "Untitled"}`}
    >
      <View style={styles.header}>
        {/* Optionally, you could add an icon here */}
        <Text style={styles.title}>
          {title || i18n.t("dailyChallenge.defaultTitle")}
        </Text>
        {completed && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{i18n.t("common.done")}</Text>
          </View>
        )}
      </View>
      <Text style={styles.desc}>
        {description || i18n.t("dailyChallenge.defaultDescription")}
      </Text>
      {completed ? null : (
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
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    completed: PropTypes.bool,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedCard: {
    backgroundColor: colors.successBackground,
    borderColor: colors.success,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
});

export default DailyChallengeCard;
