import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const PartnerSlotCard = ({ slot, onAccept }) => {
  const {
    username,
    timeSlot,
    gymName,
    tier,
    avatar,
    note,
  } = slot;

  const avatarUri = avatar
    ? { uri: avatar }
    : require("../assets/avatars/avatar1.png");

  return (
    <View style={styles.card}>
      <Image source={avatarUri} style={styles.avatar} accessibilityLabel="User avatar" />
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
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  tierLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.accentBlue,
  },
  joinBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  joinText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default PartnerSlotCard;
