// src/components/TierBadge.js

import React from "react";
import PropTypes from "prop-types";
import { View, Text, StyleSheet, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

// Static imports
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

const gradientColors = {
  Free: ["#cd7f32", "#a97142"],
  Pro: ["#c0c0c0", "#b0b0b0"],
  Elite: ["#FFD700", "#FFC300"],
  Platinum: ["#e5e4e2", "#dcdcdc"],
  Legend: ["#800080", "#a020f0"],
  Master: ["#00FFFF", "#00CED1"],
};

const TierBadge = ({ tier = "Free" }) => {
  const badgeImage = badgeImages[tier] || badgeBronze;
  const gradient = gradientColors[tier] || gradientColors.Free;

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Image source={badgeImage} style={styles.icon} resizeMode="contain" />
      <Text style={styles.text}>{tier.toUpperCase()}</Text>
    </LinearGradient>
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
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.spacing3,
    paddingVertical: spacing.spacing1,
    ...shadows.shadow2,
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: spacing.spacing1,
  },
  text: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
  },
});

export default TierBadge;
