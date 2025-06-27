// src/components/FormFeedbackCard.js
import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

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
      style={[
        styles.card,
        { borderLeftColor: getColor(color) }
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Feedback for rep ${repNumber ?? "unknown"}`}
      testID={`form-feedback-rep-${repNumber ?? "unknown"}`}
    >
      <View style={styles.headerRow}>
        {repNumber !== undefined && (
          <Text style={styles.repText}>{`Rep ${repNumber}`}</Text>
        )}
        {score !== undefined && (
          <Text style={styles.scoreText}>
            {getEmojiForScore(score)} {score}/10
          </Text>
        )}
      </View>
      <Text style={styles.feedbackText}>
        {feedback || "No specific feedback provided."}
      </Text>
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
  card: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderRadius: 12,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.overlayDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  repText: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  scoreText: {
    ...typography.smallBold,
    color: colors.success,
  },
  feedbackText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default React.memo(FormFeedbackCard);
