import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
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
    <View style={[styles.card, isWinner && styles.winnerGlow]}>
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.image}
          accessibilityLabel={i18n.t("challenge.imageAlt") || "Challenge image"}
        />
      ) : (
        <Image
          source={{ uri: placeholderImage }}
          style={styles.image}
          accessibilityLabel="Placeholder image"
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
          accessibilityRole="button"
          accessibilityLabel={i18n.t("challenge.viewCompleted") || "View completed challenge"}
        >
          <Text style={styles.viewText}>{i18n.t("challenge.completed") || "Completed"}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.enterBtn}
          onPress={onEnter}
          accessibilityRole="button"
          accessibilityLabel={
            isInProgress
              ? i18n.t("challenge.resume") || "Resume challenge"
              : i18n.t("challenge.enter") || "Enter challenge"
          }
        >
          <Text style={styles.enterText}>
            {isInProgress
              ? i18n.t("challenge.resume") || "Resume Challenge"
              : i18n.t("challenge.enter") || "Enter Challenge"}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  image: {
    width: "100%",
    height: 140,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  title: {
    ...typography.heading4,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  participants: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: spacing.md,
  },
  gymLabel: {
    color: colors.accentBlue,
    fontSize: 13,
    fontStyle: "italic",
    paddingHorizontal: spacing.md,
    paddingTop: 2,
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingTop: 4,
  },
  countdown: {
    color: colors.warning,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingTop: 2,
  },
  reward: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
  },
  verificationBadge: {
    color: colors.success,
    fontSize: 12,
    fontStyle: "italic",
    paddingHorizontal: spacing.md,
    paddingTop: 2,
  },
  enterBtn: {
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    paddingVertical: 10,
  },
  enterText: {
    color: colors.textOnPrimary,
    textAlign: "center",
    fontWeight: "600",
  },
  viewBtn: {
    backgroundColor: colors.card,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 8,
    paddingVertical: 10,
  },
  viewText: {
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "600",
  },
  winnerGlow: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
});

export default ChallengeCard;
