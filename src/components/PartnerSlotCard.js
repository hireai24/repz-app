// src/components/PartnerSlotCard.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import PropTypes from "prop-types";
import LinearGradient from "react-native-linear-gradient";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

import defaultAvatar from "../assets/avatars/avatar1.png";

const PartnerSlotCard = ({ slot, onAccept }) => {
  const { username, timeSlot, gymName, tier, avatar, note } = slot;

  const avatarSource = avatar ? { uri: avatar } : defaultAvatar;

  return (
    <View style={styles.card}>
      <Image
        source={avatarSource}
        style={styles.avatar}
        accessibilityLabel="User avatar"
      />

      <View style={styles.details}>
        <Text style={styles.name}>{username || "REPZ User"}</Text>
        <Text style={styles.meta}>
          {timeSlot} • {gymName}
        </Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}

        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tierBadge}
        >
          <Text style={styles.tierText}>{tier || "Free"} Tier</Text>
        </LinearGradient>
      </View>

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.joinBtn}
      >
        <TouchableOpacity
          onPress={onAccept}
          accessibilityRole="button"
          accessibilityLabel="Accept training session"
          testID={`accept-partner-${username?.toLowerCase().replace(/\s+/g, "-") || "user"}`}
        >
          <Text style={styles.joinText}>Join</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

PartnerSlotCard.propTypes = {
  slot: PropTypes.shape({
    username: PropTypes.string,
    timeSlot: PropTypes.string.isRequired,
    gymName: PropTypes.string,
    tier: PropTypes.string,
    avatar: PropTypes.string,
    note: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    padding: spacing.spacing4,
    marginBottom: spacing.spacing4,
    ...shadows.shadow3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: spacing.radiusFull,
    marginRight: spacing.spacing4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  details: {
    flex: 1,
  },
  name: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  note: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 4,
  },
  tierBadge: {
    marginTop: spacing.spacing2,
    alignSelf: "flex-start",
    borderRadius: spacing.radiusFull,
    paddingVertical: spacing.spacing1,
    paddingHorizontal: spacing.spacing3,
  },
  tierText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
  joinBtn: {
    borderRadius: spacing.radiusFull,
    marginLeft: spacing.spacing3,
  },
  joinText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing5,
  },
});

export default PartnerSlotCard;
