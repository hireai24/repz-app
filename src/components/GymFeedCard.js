// src/components/GymFeedCard.js

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from "react-native";
import PropTypes from "prop-types";
import LinearGradient from "react-native-linear-gradient";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

const fallbackIcon = require("../assets/gymFeed/gym-icon.png");

const GymFeedCard = ({ post }) => {
  return (
    <View style={styles.card}>
      {post.imageUrl && (
        <View style={styles.imageWrapper}>
          <ImageBackground
            source={{ uri: post.imageUrl }}
            style={styles.image}
            imageStyle={styles.imageStyle}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.4)", "transparent"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.gradientOverlay}
            />
          </ImageBackground>
        </View>
      )}

      <View style={styles.row}>
        <Image
          source={post.gymLogo ? { uri: post.gymLogo } : fallbackIcon}
          defaultSource={fallbackIcon}
          style={styles.avatar}
          accessibilityLabel="Gym avatar"
        />

        <View style={styles.meta}>
          <Text style={styles.gymName}>{post.gymName || "Gym"}</Text>
          <Text style={styles.date}>
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={styles.text}>{post.text}</Text>

      {post.offer && (
        <Text style={styles.offer}>🎉 {post.offer}</Text>
      )}

      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ctaButton}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Join this gym"
        >
          <Text style={styles.ctaText}>Join This Gym</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

GymFeedCard.propTypes = {
  post: PropTypes.shape({
    imageUrl: PropTypes.string,
    gymLogo: PropTypes.string,
    gymName: PropTypes.string,
    text: PropTypes.string.isRequired,
    offer: PropTypes.string,
    createdAt: PropTypes.number.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: spacing.radiusXl,
    marginBottom: spacing.spacing5,
    padding: spacing.spacing4,
    ...shadows.shadow3,
  },
  imageWrapper: {
    borderRadius: spacing.radiusLg,
    overflow: "hidden",
    marginBottom: spacing.spacing4,
  },
  image: {
    height: 180,
    width: "100%",
    justifyContent: "flex-end",
  },
  imageStyle: {
    resizeMode: "cover",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.spacing3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: spacing.radiusFull,
    marginRight: spacing.spacing3,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  meta: {
    flex: 1,
  },
  gymName: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.spacing2,
  },
  offer: {
    ...typography.bodyBold,
    color: colors.accentBlue,
    marginBottom: spacing.spacing2,
  },
  ctaButton: {
    alignSelf: "flex-start",
    borderRadius: spacing.radiusFull,
  },
  ctaText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing6,
  },
});

export default GymFeedCard;
