import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import PropTypes from "prop-types";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

// ✅ Static import of fallback avatar image
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
        <Text style={styles.tierLabel}>Tier: {tier || "Free"}</Text>
      </View>
      <TouchableOpacity
        style={styles.joinBtn}
        onPress={onAccept}
        accessibilityRole="button"
        accessibilityLabel="Accept training session"
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
    // Ensure participants is also in PropTypes if you plan to use it for display
    participants: PropTypes.arrayOf(PropTypes.string),
    userId: PropTypes.string, // The ID of the user who created the slot
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 24,
    height: 48,
    marginRight: spacing.md,
    width: 48,
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    flexDirection: "row",
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  details: {
    flex: 1,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  joinText: {
    color: colors.white,
    fontWeight: "600",
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  name: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  tierLabel: {
    color: colors.accentBlue,
    fontSize: 12,
    marginTop: 4,
  },
});

export default PartnerSlotCard;
