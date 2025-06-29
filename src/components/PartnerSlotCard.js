// src/components/PartnerSlotCard.js
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import PropTypes from "prop-types";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadow";

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

        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{tier || "Free"} Tier</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.joinBtn}
        onPress={onAccept}
        accessibilityRole="button"
        accessibilityLabel="Accept training session"
        testID={`accept-partner-${username?.toLowerCase().replace(/\s+/g, "-") || "user"}`}
      >
        <Text style={styles.joinText}>Join</Text>
      </TouchableOpacity>
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
    participants: PropTypes.arrayOf(PropTypes.string),
    userId: PropTypes.string,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusLg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.elevationCard,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: spacing.radiusPill,
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  name: {
    ...typography.heading4,
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
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.accentBlue,
    borderRadius: spacing.radiusSm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tierText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
  },
});

export default PartnerSlotCard;
