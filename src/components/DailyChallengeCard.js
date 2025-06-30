// src/components/DailyChallengeCard.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import LinearGradient from "react-native-linear-gradient";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";
import shadows from "../theme/shadows";
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
      {!completed && (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <TouchableOpacity
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel="Complete daily challenge"
          >
            <Text style={styles.buttonText}>{i18n.t("common.submit")}</Text>
          </TouchableOpacity>
        </LinearGradient>
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
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    padding: spacing.spacing5,
    marginBottom: spacing.spacing5,
    ...shadows.shadow3,
  },
  completedCard: {
    borderColor: colors.success,
    borderWidth: 2,
    shadowColor: colors.success,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.spacing3,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.spacing2,
  },
  badge: {
    backgroundColor: colors.success,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.spacing3,
    paddingVertical: 4,
    ...shadows.shadow1,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  desc: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.spacing4,
  },
  button: {
    alignSelf: "flex-start",
    borderRadius: spacing.radiusFull,
  },
  buttonText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    textAlign: "center",
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing6,
  },
});

export default DailyChallengeCard;
