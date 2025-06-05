import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

import colors from "../theme/colors";
import TierBadge from "./TierBadge";

const placeholderImage = "https://via.placeholder.com/150";

const ChallengeCard = ({
  challenge,
  onEnter,
  onView,
  progress = {},
  participantUsernames = [], // Add this prop
}) => {
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
        <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
          {title}
        </Text>
        {requiredTier && <TierBadge tier={requiredTier} />}
      </View>

      {/* Show participant usernames if available */}
      {participantUsernames.length > 0 && (
        <Text style={styles.participants} numberOfLines={1}>
          👥 {participantUsernames.join(", ")}
        </Text>
      )}

      {gymName && (
        <Text
          style={styles.gymLabel}
          accessibilityLabel={`Hosted by ${gymName}`}
        >
          🏋️ {gymName}
        </Text>
      )}

      <Text style={[styles.status, { color: getStatusColor() }]}>{status}</Text>

      {expiresAt && <Text style={styles.countdown}>{getCountdown()}</Text>}

      <Text style={styles.reward}>
        +{xpReward} XP • 💰 {xpPot} XP Pot
      </Text>

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
  participantUsernames: PropTypes.arrayOf(PropTypes.string),
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 14,
    paddingVertical: 10,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
  },
  challengeImage: {
    borderRadius: 10,
    height: 140,
    marginBottom: 10,
    width: "100%",
  },
  countdown: {
    color: colors.warning,
    fontSize: 13,
    marginTop: 2,
  },
  gymLabel: {
    color: colors.accentBlue,
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 4,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  participants: {
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 2,
    marginTop: 2,
  },
  reward: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    paddingRight: 10,
  },
  verificationBadge: {
    color: colors.success,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  viewBtn: {
    backgroundColor: colors.card,
    borderRadius: 8,
    marginTop: 14,
    paddingVertical: 10,
  },
  viewText: {
    color: colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  winnerGlow: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
});

export default ChallengeCard;
