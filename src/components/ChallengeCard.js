import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

import colors from "../theme/colors";
import TierBadge from "./TierBadge";

const placeholderImage = "https://via.placeholder.com/150";

const ChallengeCard = ({ challenge, onEnter, onView, progress = {} }) => {
  const {
    title,
    status,
    xpReward,
    requiredTier,
    image,
    gymName,
    expiresAt,
    isWinner,
    aiVerified,
    votes = 0,
    xpPot = 0,
  } = challenge;

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case "active":
        return colors.success;
      case "expired":
        return colors.disabled;
      case "upcoming":
        return colors.secondary;
      default:
        return colors.textSecondary;
    }
  };

  const isCompleted = progress?.completed;
  const isInProgress = progress?.inProgress;

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
    <View style={[styles.card, isWinner && styles.winnerGlow]}>
      {image && (
        <Image
          source={{ uri: image || placeholderImage }}
          style={styles.challengeImage}
          accessibilityLabel="Challenge image"
        />
      )}

      <View style={styles.header}>
        <Text
          style={styles.title}
          numberOfLines={2}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {requiredTier && <TierBadge tier={requiredTier} />}
      </View>

      {gymName && (
        <Text
          style={styles.gymLabel}
          accessibilityLabel={`Hosted by ${gymName}`}
        >
          🏋️ {gymName}
        </Text>
      )}

      <Text style={[styles.status, { color: getStatusColor() }]}>
        {status}
      </Text>

      {expiresAt && (
        <Text style={styles.countdown}>{getCountdown()}</Text>
      )}

      <Text style={styles.reward}>+{xpReward} XP • 💰 {xpPot} XP Pot</Text>

      {(aiVerified || votes > 0) && (
        <Text style={styles.verificationBadge}>
          ✅ Verified {aiVerified ? "by AI" : ""} {votes > 0 ? "+ Votes" : ""}
        </Text>
      )}

      {isCompleted ? (
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={onView}
          accessibilityRole="button"
          accessibilityLabel="View completed challenge"
        >
          <Text style={styles.viewText}>Completed</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={onEnter}
          accessibilityRole="button"
          accessibilityLabel={
            isInProgress ? "Resume challenge" : "Enter challenge"
          }
        >
          <Text style={styles.buttonText}>
            {isInProgress ? "Resume Challenge" : "Enter Challenge"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    xpReward: PropTypes.number.isRequired,
    requiredTier: PropTypes.string,
    image: PropTypes.string,
    gymName: PropTypes.string,
    expiresAt: PropTypes.object,
    isWinner: PropTypes.bool,
    aiVerified: PropTypes.bool,
    votes: PropTypes.number,
    xpPot: PropTypes.number,
  }).isRequired,
  onEnter: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  progress: PropTypes.shape({
    completed: PropTypes.bool,
    inProgress: PropTypes.bool,
  }),
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  winnerGlow: {
    borderColor: "#FFD700",
    borderWidth: 2,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  challengeImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.textPrimary,
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
    paddingRight: 10,
  },
  gymLabel: {
    color: colors.accentBlue || "#2196F3",
    marginTop: 4,
    fontSize: 13,
    fontStyle: "italic",
  },
  status: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  countdown: {
    fontSize: 13,
    color: colors.warning || "#FFA500",
    marginTop: 2,
  },
  reward: {
    color: colors.textSecondary,
    marginTop: 6,
    fontSize: 13,
  },
  verificationBadge: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    fontStyle: "italic",
  },
  button: {
    backgroundColor: colors.primary,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  viewBtn: {
    backgroundColor: colors.card,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewText: {
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ChallengeCard;
