// src/components/GymFeedCard.js
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const fallbackIcon = require("../assets/gymFeed/gym-icon.png");

const GymFeedCard = ({ post }) => {
  return (
    <View style={styles.card}>
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
          accessibilityLabel="Post image"
        />
      )}

      <View style={styles.row}>
        <Image
          source={{ uri: post.gymLogo } || fallbackIcon}
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

      <TouchableOpacity style={styles.ctaButton}>
        <Text style={styles.ctaText}>Join This Gym</Text>
      </TouchableOpacity>
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  image: {
    borderRadius: 8,
    height: 180,
    marginBottom: spacing.sm,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  meta: {
    flex: 1,
  },
  gymName: {
    ...typography.subheading,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  offer: {
    ...typography.subheading,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  ctaText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    fontSize: 13,
  },
});

export default GymFeedCard;
