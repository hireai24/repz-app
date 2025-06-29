// src/components/TierBadge.js
import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, Image } from "react-native";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadow";

// Static imports to avoid dynamic require errors
import badgeBronze from "../assets/badges/badge-bronze.png";
import badgeSilver from "../assets/badges/badge-silver.png";
import badgeGold from "../assets/badges/badge-gold.png";
import badgePlatinum from "../assets/badges/badge-platinum.png";
import badgeLegend from "../assets/badges/badge-legend.png";
import badgeMaster from "../assets/badges/badge-master.png";

const badgeImages = {
  Free: badgeBronze,
  Pro: badgeSilver,
  Elite: badgeGold,
  Platinum: badgePlatinum,
  Legend: badgeLegend,
  Master: badgeMaster,
};

const TierBadge = ({ tier = "Free" }) => {
  const badgeImage = badgeImages[tier] || badgeBronze;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Tier: ${tier}`}
    >
      <Image source={badgeImage} style={styles.icon} resizeMode="contain" />
      <Text style={styles.text}>{tier.toUpperCase()}</Text>
    </View>
  );
};

TierBadge.propTypes = {
  tier: PropTypes.oneOf([
    "Free",
    "Pro",
    "Elite",
    "Platinum",
    "Legend",
    "Master",
  ]),
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusLg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.elevationGlass,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: spacing.xs,
  },
  text: {
    ...typography.smallBold,
    color: colors.textPrimary,
  },
});

export default TierBadge;
