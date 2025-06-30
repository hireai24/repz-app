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
  ImageBackground,
} from "react-native";

import LinearGradient from "react-native-linear-gradient";
import { useTier } from "../context/TierContext";
import { purchasePlan } from "../api/marketplaceApi";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

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
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={
            plan.thumbnail
              ? { uri: plan.thumbnail }
              : require("../assets/plan-bg-gradient.png")
          }
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.imageOverlay}
          />
        </ImageBackground>
      </View>

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
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tierBadge}
            >
              <Text style={styles.tierText}>{plan.tier}</Text>
            </LinearGradient>
          )}
        </View>

        {plan.price > 0 && (
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buyBtn, buyLoading && styles.disabled]}
          >
            <TouchableOpacity
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
          </LinearGradient>
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
    borderRadius: spacing.radiusXl,
    marginBottom: spacing.spacing5,
    overflow: "hidden",
    ...shadows.shadow3,
  },
  imageWrapper: {
    borderTopLeftRadius: spacing.radiusXl,
    borderTopRightRadius: spacing.radiusXl,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 160,
    justifyContent: "flex-end",
  },
  imageStyle: {
    resizeMode: "cover",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: spacing.spacing4,
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.spacing1,
  },
  author: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.spacing1,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.spacing3,
  },
  price: {
    color: colors.success,
    fontWeight: "bold",
    fontSize: 18,
  },
  tierBadge: {
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.spacing3,
    paddingVertical: spacing.spacing1,
  },
  tierText: {
    ...typography.caption,
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
  buyBtn: {
    borderRadius: spacing.radiusFull,
    marginTop: spacing.spacing3,
  },
  buyText: {
    ...typography.button,
    color: colors.textOnPrimary,
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing5,
  },
  disabled: {
    opacity: 0.6,
  },
  skeletonImage: {
    backgroundColor: colors.surface,
    height: 160,
    width: "100%",
  },
  skeletonText: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusSm,
    height: 14,
    marginTop: spacing.spacing2,
    width: "80%",
  },
  skeletonText40: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusSm,
    height: 14,
    marginTop: spacing.spacing2,
    width: "40%",
  },
  skeletonText60: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radiusSm,
    height: 14,
    marginTop: spacing.spacing2,
    width: "60%",
  },
});

export default PlanCard;
