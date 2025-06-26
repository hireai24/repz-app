import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet } from "react-native";

import colors from "../theme/colors";

const TierBadge = ({ tier }) => {
  let backgroundColor = colors.free;
  let textColor = colors.textSecondary;

  switch (tier) {
    case "Pro":
      backgroundColor = colors.success;
      textColor = colors.background;
      break;
    case "Elite":
      backgroundColor = colors.primary;
      textColor = colors.textPrimary;
      break;
    case "Free":
    default:
      backgroundColor = colors.free;
      textColor = colors.textSecondary;
  }

  return (
    <View
      style={[styles.badge, { backgroundColor }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Tier: ${tier || "Free"}`}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {(tier || "Free").toUpperCase()}
      </Text>
    </View>
  );
};

TierBadge.propTypes = {
  tier: PropTypes.oneOf(["Free", "Pro", "Elite"]),
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default TierBadge;
