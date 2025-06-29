// src/components/PlanCard.js
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";

import { useTier } from "../context/TierContext";
import { purchasePlan } from "../api/marketplaceApi";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadow";

const PlanCard = ({
  plan,
  onPress,
  creatorStripeAccountId,
  isLoading = false,
}) => {
  const { tier } = useTier();
  const isLocked = plan?.tier === "Pro" || plan?.tier === "Elite";
  const [buyLoading, setBuyLoading] = useState(false);

  const handleBuy = async () => {
    if (isLocked) {
      if (tier === "Free" || (plan.tier === "Elite" && tier === "Pro")) {
        return Alert.alert(
          "Upgrade Required",
          `You need a ${plan.tier} tier subscription to purchase this plan.`
        );
      }
    }

    if (!creatorStripeAccountId) {
      return Alert.alert(
        "Unavailable",
        "The creator of this plan has not set up payouts. Please try another plan."
      );
    }

    try {
      setBuyLoading(true);
      const result = await purchasePlan(plan.id);
      if (result?.url) {
        Linking.openURL(result.url);
      } else {
        throw new Error("Invalid checkout URL returned.");
      }
    } catch (err) {
      Alert.alert(
        "Purchase failed",
        err.message || "Something went wrong while trying to buy the plan."
      );
    } finally {
      setBuyLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.card, styles.disabled]} accessibilityRole="progressbar">
        <View style={styles.skeletonImage} />
        <View style={styles.content}>
          <View style={styles.skeletonText} />
          <View style={styles.skeletonText40} />
          <View style={styles.skeletonText60} />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={buyLoading}
      accessibilityRole="button"
      accessibilityLabel={`View plan ${plan.name}`}
    >
      <Image
        source={
          plan.thumbnail
            ? { uri: plan.thumbnail }
            : require("../assets/plan-bg-gradient.png")
        }
        style={styles.image}
        accessibilityLabel={`Thumbnail for ${plan.name}`}
      />

      <View style={styles.content}>
        <Text style={styles.title}>{plan.name}</Text>
        <Text style={styles.author}>by {plan.author}</Text>
        <Text style={styles.meta}>
          {plan.duration} weeks • {plan.level}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>
            {plan.price === 0 ? "Free" : `£${plan.price}`}
          </Text>
          {isLocked && (
            <Text
              style={[
                styles.tier,
                plan.tier === "Elite" ? styles.elite : styles.pro,
              ]}
            >
              {plan.tier}
            </Text>
          )}
        </View>

        {plan.price > 0 && (
          <TouchableOpacity
            style={[styles.buyBtn, buyLoading && styles.disabled]}
            onPress={handleBuy}
            disabled={buyLoading}
            accessibilityRole="button"
            accessibilityLabel="Purchase this plan"
          >
            {buyLoading ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.buyText}>PURCHASE</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    tier: PropTypes.string,
    thumbnail: PropTypes.string,
    author: PropTypes.string,
    duration: PropTypes.number,
    level: PropTypes.string,
    price: PropTypes.number,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  creatorStripeAccountId: PropTypes.string,
  isLoading: PropTypes.bool,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusLg,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadows.elevationCard,
  },
  image: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 18,
  },
  author: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  price: {
    color: colors.success,
    fontWeight: "bold",
    fontSize: 16,
  },
  tier: {
    fontSize: 13,
    fontWeight: "bold",
  },
  pro: {
    color: colors.primary,
  },
  elite: {
    color: colors.pro,
  },
  buyBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.radiusMd,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  buyText: {
    ...typography.button,
    color: colors.textOnPrimary,
  },
  disabled: {
    opacity: 0.6,
  },
  skeletonImage: {
    backgroundColor: colors.surface,
    height: 140,
    width: "100%",
  },
  skeletonText: {
    backgroundColor: colors.surface,
    borderRadius: spacing.xs,
    height: 14,
    marginTop: 8,
    width: "80%",
  },
  skeletonText40: {
    backgroundColor: colors.surface,
    borderRadius: spacing.xs,
    height: 14,
    marginTop: 8,
    width: "40%",
  },
  skeletonText60: {
    backgroundColor: colors.surface,
    borderRadius: spacing.xs,
    height: 14,
    marginTop: 8,
    width: "60%",
  },
});

export default PlanCard;
