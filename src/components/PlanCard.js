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

const PlanCard = ({
  plan,
  onPress,
  buyerId,
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
          `You need a ${plan.tier} tier subscription to purchase this plan.`,
        );
      }
    }

    if (!creatorStripeAccountId) {
      return Alert.alert(
        "Unavailable",
        "The creator of this plan has not set up payouts. Please try another plan.",
      );
    }

    try {
      setBuyLoading(true);

      const result = await purchasePlan({
        planId: plan.id,
        buyerId,
        creatorStripeAccountId,
        priceInCents: Math.round(plan.price * 100),
      });

      if (result?.url) {
        Linking.openURL(result.url);
      } else {
        throw new Error("Invalid checkout URL returned.");
      }
    } catch (err) {
      console.error("Buy failed:", err);
      Alert.alert(
        "Purchase failed",
        err.message || "Something went wrong while trying to buy the plan.",
      );
    } finally {
      setBuyLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[styles.card, styles.disabled]}
        accessibilityRole="progressbar"
      >
        <View style={styles.skeletonImage} />
        <View style={styles.content}>
          <View style={styles.skeletonText} />
          <View style={[styles.skeletonText, { width: "60%" }]} />
          <View style={[styles.skeletonText, { width: "40%" }]} />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={buyLoading}
      accessibilityLabel={`View plan ${plan.name}`}
      accessibilityRole="button"
      testID={`plan-card-${plan.name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Image
        source={{
          uri:
            plan.thumbnail ||
            "https://via.placeholder.com/400x200.png?text=PLAN",
        }}
        style={styles.image}
        accessible
        accessibilityRole="image"
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
            accessibilityLabel="Buy this plan"
          >
            {buyLoading ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.buyText}>Buy Now</Text>
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
  buyerId: PropTypes.string.isRequired,
  creatorStripeAccountId: PropTypes.string,
  isLoading: PropTypes.bool,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.md,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  image: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  content: {
    padding: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
  author: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  meta: {
    color: colors.border,
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    color: colors.success,
    fontWeight: "bold",
  },
  tier: {
    fontWeight: "bold",
    fontSize: 13,
  },
  pro: {
    color: colors.primary,
  },
  elite: {
    color: colors.pro,
  },
  buyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: spacing.sm,
    alignItems: "center",
  },
  buyText: {
    color: colors.textPrimary,
    fontWeight: "bold",
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
    height: 14,
    backgroundColor: colors.surface,
    borderRadius: spacing.xs,
    marginTop: 8,
    width: "80%",
  },
});

export default PlanCard;
