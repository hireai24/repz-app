import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import PropTypes from "prop-types";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

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
        <Text style={styles.meta}>{timeSlot} • {gymName}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  note: {
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
  },
  tierBadge: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    backgroundColor: colors.accentBlue,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tierText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  joinBtn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinText: {
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
});

export default PartnerSlotCard;
