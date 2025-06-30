// src/components/ChallengeWagerCard.js

import React from "react";
import PropTypes from "prop-types";
import { Text, StyleSheet, TouchableOpacity, View } from "react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";
import shadows from "../theme/shadows";
import i18n from "../locales/i18n";

const ChallengeWagerCard = ({ challenge, onPress }) => {
  const {
    title,
    exercise,
    xp,
    xpPot,
    status,
    opponents = [],
    winnerId,
    userId,
    verified,
    flagged,
    type,
    votes = 0,
    expiresAt,
  } = challenge;

  const isUserWinner = winnerId && winnerId === userId;
  const isUserLoser = winnerId && winnerId !== userId;

  const getStatusLabel = () => {
    if (isUserWinner) return i18n.t("challengeWager.winner");
    if (isUserLoser) return i18n.t("challengeWager.loser");
    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : i18n.t("challengeWager.pending");
  };

  const getCountdown = () => {
    if (!expiresAt) return null;
    const end = new Date(expiresAt.seconds * 1000);
    const diff = end - new Date();
    if (diff <= 0) return "⏰ Ended";
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    return `⏳ ${hours}h ${minutes}m`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isUserWinner && styles.winnerGlow,
        isUserLoser && styles.loserBorder,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View challenge: ${title || "XP Challenge"}`}
    >
      <Text style={styles.title}>{title || i18n.t("challengeWager.defaultTitle")}</Text>

      <View style={styles.section}>
        <Text style={styles.detail}>
          💪 {i18n.t("challengeWager.selectExercise")}: {exercise || "N/A"}
        </Text>
        <Text style={styles.detail}>
          🧩 {i18n.t("challengeWager.type")}: {type?.toUpperCase() || "N/A"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.detail}>
          ⚔️ {i18n.t("challengeWager.opponents")}:{" "}
          {opponents.length > 0
            ? opponents.join(", ")
            : i18n.t("challengeWager.noOpponentsYet")}
        </Text>
        <Text style={styles.detail}>
          🎯 {i18n.t("challengeWager.wagerAmount")}: {xp} XP
        </Text>
        <Text style={styles.detail}>💰 Pot: {xpPot || xp} XP</Text>
      </View>

      {expiresAt && (
        <Text style={styles.countdown}>{getCountdown()}</Text>
      )}

      {(verified || votes > 0) && (
        <Text style={styles.verified}>
          ✅ Verified {verified ? "by AI" : ""} {votes > 0 ? "+ Votes" : ""}
        </Text>
      )}

      {flagged && (
        <Text style={styles.flagged}>
          ⚠️ {i18n.t("challengeWager.flagged")}
        </Text>
      )}

      <View style={styles.statusContainer}>
        <Text
          style={[
            styles.status,
            isUserWinner && styles.winner,
            isUserLoser && styles.loser,
          ]}
        >
          {getStatusLabel()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

ChallengeWagerCard.propTypes = {
  challenge: PropTypes.shape({
    title: PropTypes.string,
    exercise: PropTypes.string,
    xp: PropTypes.number,
    xpPot: PropTypes.number,
    status: PropTypes.string,
    opponents: PropTypes.arrayOf(PropTypes.string),
    winnerId: PropTypes.string,
    userId: PropTypes.string,
    verified: PropTypes.bool,
    flagged: PropTypes.bool,
    type: PropTypes.string,
    votes: PropTypes.number,
    expiresAt: PropTypes.object,
  }).isRequired,
  onPress: PropTypes.func,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    padding: spacing.spacing5,
    marginBottom: spacing.spacing5,
    ...shadows.shadow3,
  },
  winnerGlow: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  loserBorder: {
    borderColor: colors.danger,
    borderWidth: 1,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.spacing3,
  },
  section: {
    marginBottom: spacing.spacing3,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  countdown: {
    ...typography.caption,
    color: colors.warning,
    marginBottom: spacing.spacing2,
  },
  verified: {
    ...typography.caption,
    color: colors.accentBlue,
    fontWeight: "600",
    marginBottom: spacing.spacing2,
  },
  flagged: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
    marginBottom: spacing.spacing2,
  },
  statusContainer: {
    marginTop: spacing.spacing2,
    alignItems: "flex-start",
  },
  status: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  winner: {
    color: colors.success,
  },
  loser: {
    color: colors.danger,
  },
});

export default ChallengeWagerCard;
