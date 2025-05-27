import React from "react";
import PropTypes from "prop-types";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import colors from "../theme/colors";
import typography from "../theme/typography";
import spacing from "../theme/spacing";
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
    return status || "Pending";
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
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{title || "XP Challenge"}</Text>
      <Text style={styles.detail}>
        💪 {i18n.t("challengeWager.selectExercise")}: {exercise}
      </Text>
      <Text style={styles.detail}>🧩 Type: {type?.toUpperCase() || "N/A"}</Text>
      <Text style={styles.detail}>
        ⚔️ {i18n.t("challengeWager.opponents")}:{" "}
        {opponents.length > 0 ? opponents.join(", ") : "-"}
      </Text>
      <Text style={styles.detail}>
        🎯 {i18n.t("challengeWager.wagerAmount")}: {xp} XP
      </Text>
      <Text style={styles.detail}>💰 Pot: {xpPot || xp} XP</Text>

      {expiresAt && <Text style={styles.countdown}>{getCountdown()}</Text>}

      {(verified || votes > 0) && (
        <Text style={styles.verified}>
          ✅ Verified {verified ? "by AI" : ""} {votes > 0 ? "+ Votes" : ""}
        </Text>
      )}

      {flagged && (
        <Text style={styles.flagged}>
          ⚠️ {i18n.t("challengeWager.flagged") || "Flagged for review"}
        </Text>
      )}

      <Text
        style={[
          styles.status,
          isUserWinner && styles.winner,
          isUserLoser && styles.loser,
        ]}
      >
        {getStatusLabel()}
      </Text>
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
    creatorName: PropTypes.string, // still included in shape, even though unused
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
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  countdown: {
    color: colors.warning,
    fontSize: 13,
    marginBottom: 4,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  flagged: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  loser: {
    color: colors.error,
  },
  status: {
    color: colors.textSecondary,
    fontWeight: "bold",
    marginTop: spacing.sm,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  verified: {
    color: colors.accentBlue,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  winner: {
    color: colors.success,
  },
});

export default ChallengeWagerCard;
