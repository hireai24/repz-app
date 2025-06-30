// src/components/ChallengeCard.js

import React from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";
import TierBadge from "./TierBadge";

const placeholderImage = "https://via.placeholder.com/300x150";

const ChallengeCard = ({
  challenge,
  onEnter,
  onView,
  progress = {},
  participantUsernames = [],
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

  const isCompleted = progress?.completed;
  const isInProgress = progress?.inProgress;

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
      activeOpacity={0.95}
      style={[styles.card, isWinner && styles.winnerGlow]}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={image ? { uri: image } : { uri: placeholderImage }}
          style={styles.image}
          accessibilityLabel="Challenge image"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientOverlay}
        />
      </View>

      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {requiredTier && <TierBadge tier={requiredTier} />}
      </View>

      {participantUsernames.length > 0 && (
        <Text style={styles.participants} numberOfLines={1}>
          👥 {participantUsernames.join(", ")}
        </Text>
      )}

      {gymName && (
        <Text style={styles.gymLabel}>🏋️ {gymName}</Text>
      )}

      <Text style={[styles.status, { color: getStatusColor() }]}>{status}</Text>

      {expiresAt && (
        <Text style={styles.countdown}>{getCountdown()}</Text>
      )}

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
        >
          <Text style={styles.viewText}>Completed</Text>
        </TouchableOpacity>
      ) : (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.enterBtn}
        >
          <TouchableOpacity
            onPress={onEnter}
            style={styles.enterTouchable}
          >
            <Text style={styles.enterText}>
              {isInProgress ? "Resume Challenge" : "Enter Challenge"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </TouchableOpacity>
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
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    marginBottom: spacing.spacing6,
    overflow: "hidden",
    ...shadows.shadowHero,
  },
  winnerGlow: {
    borderColor: colors.gold,
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 160,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.spacing4,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.spacing2,
  },
  participants: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.spacing4,
  },
  gymLabel: {
    ...typography.caption,
    color: colors.accentBlue,
    fontStyle: "italic",
    paddingHorizontal: spacing.spacing4,
    paddingTop: 2,
  },
  status: {
    ...typography.caption,
    fontWeight: "600",
    paddingHorizontal: spacing.spacing4,
    paddingTop: 4,
  },
  countdown: {
    ...typography.caption,
    color: colors.warning,
    paddingHorizontal: spacing.spacing4,
    paddingTop: 2,
  },
  reward: {
    ...typography.caption,
    color: colors.textSecondary,
    paddingHorizontal: spacing.spacing4,
    paddingTop: 4,
  },
  verificationBadge: {
    ...typography.caption,
    color: colors.success,
    fontStyle: "italic",
    paddingHorizontal: spacing.spacing4,
    paddingTop: 2,
  },
  enterBtn: {
    borderRadius: spacing.radiusFull,
    marginTop: spacing.spacing3,
    marginHorizontal: spacing.spacing4,
    marginBottom: spacing.spacing4,
  },
  enterTouchable: {
    alignItems: "center",
    paddingVertical: spacing.spacing3,
  },
  enterText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
  },
  viewBtn: {
    backgroundColor: colors.cardBackground,
    marginTop: spacing.spacing3,
    marginHorizontal: spacing.spacing4,
    marginBottom: spacing.spacing4,
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.spacing3,
  },
  viewText: {
    ...typography.smallBold,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

export default ChallengeCard;
