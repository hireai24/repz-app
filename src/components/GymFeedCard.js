// src/components/GymFeedCard.js
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import PropTypes from "prop-types";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymFeedCard = ({ post }) => {
  return (
    <View style={styles.card}>
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.image} />
      )}
      <Text style={styles.text}>{post.text}</Text>
      {post.offer && <Text style={styles.offer}>🎉 {post.offer}</Text>}
      <Text style={styles.date}>
        {new Date(post.createdAt).toLocaleString()}
      </Text>
    </View>
  );
};

GymFeedCard.propTypes = {
  post: PropTypes.shape({
    imageUrl: PropTypes.string,
    text: PropTypes.string.isRequired,
    offer: PropTypes.string,
    createdAt: PropTypes.number.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  image: {
    borderRadius: 6,
    height: 180,
    marginBottom: spacing.sm,
    width: "100%",
  },
  offer: {
    ...typography.subheading,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
});

export default GymFeedCard;
