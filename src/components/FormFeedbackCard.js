// src/components/FormFeedbackCard.js

import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

const getColor = (color) => {
  switch (color) {
    case "green":
      return colors.success;
    case "yellow":
      return colors.warning;
    case "red":
      return colors.danger;
    default:
      return colors.border;
  }
};

const getEmojiForScore = (score) => {
  if (score >= 9) return "🏆";
  if (score >= 7) return "💪";
  if (score >= 5) return "👍";
  return "⚠️";
};

const FormFeedbackCard = ({ rep }) => {
  if (!rep) return null;

  const { rep: repNumber, score, feedback, color } = rep;

  return (
    <View
      style={styles.cardWrapper}
      accessibilityRole="summary"
      accessibilityLabel={`Feedback for rep ${repNumber ?? "unknown"}`}
      testID={`form-feedback-rep-${repNumber ?? "unknown"}`}
    >
      <LinearGradient
        colors={[
          getColor(color),
          getColor(color) + "00" // Fade out to transparent
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.borderAccent}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          {repNumber !== undefined && (
            <Text style={styles.repText}>{`Rep ${repNumber}`}</Text>
          )}
          {score !== undefined && (
            <Text style={[styles.scoreText, { color: getColor(color) }]}>
              <Text style={styles.emoji}>{getEmojiForScore(score)}</Text>{" "}
              {score}/10
            </Text>
          )}
        </View>
        <Text style={styles.feedbackText}>
          {feedback || "No specific feedback provided."}
        </Text>
      </View>
    </View>
  );
};

FormFeedbackCard.propTypes = {
  rep: PropTypes.shape({
    rep: PropTypes.number,
    score: PropTypes.number,
    feedback: PropTypes.string,
    color: PropTypes.oneOf(["green", "yellow", "red"]),
  }),
};

const styles = StyleSheet.create({
  cardWrapper: {
    flexDirection: "row",
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    marginBottom: spacing.spacing4,
    overflow: "hidden",
    ...shadows.shadow3,
  },
  borderAccent: {
    width: 6,
  },
  content: {
    flex: 1,
    padding: spacing.spacing4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.spacing2,
  },
  repText: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  scoreText: {
    ...typography.bodyBold,
  },
  emoji: {
    fontSize: 18,
    marginRight: 4,
  },
  feedbackText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.spacing1,
  },
});

export default React.memo(FormFeedbackCard);
