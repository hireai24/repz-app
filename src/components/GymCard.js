// src/components/GymCard.js

import React from "react";
import PropTypes from "prop-types";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";

const fallbackBanner = require("../assets/gymFeed/cover1.png");
const fallbackIcon = require("../assets/gymFeed/gym-icon.png");

const GymCard = ({ gym }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate("GymProfileScreen", { gym });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.card}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`View gym profile for ${gym.name}`}
    >
      <ImageBackground
        source={
          gym.coverImage || gym.image
            ? { uri: gym.coverImage || gym.image }
            : fallbackBanner
        }
        defaultSource={fallbackBanner}
        style={styles.banner}
        imageStyle={styles.bannerImage}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientOverlay}
        />
        <View style={styles.avatarWrapper}>
          <Image
            source={gym.logo ? { uri: gym.logo } : fallbackIcon}
            defaultSource={fallbackIcon}
            style={styles.avatar}
            accessibilityRole="image"
            accessibilityLabel={`${gym.name} logo`}
          />
        </View>
        <View style={styles.textWrapper}>
          <Text style={styles.name}>{gym.name || "Unnamed Gym"}</Text>
          <Text style={styles.location}>
            {gym.location || "Location not specified"}
          </Text>
          {gym.description ? (
            <Text
              style={styles.description}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {gym.description}
            </Text>
          ) : null}
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Visit Gym</Text>
          </LinearGradient>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

GymCard.propTypes = {
  gym: PropTypes.shape({
    coverImage: PropTypes.string,
    image: PropTypes.string,
    logo: PropTypes.string,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.radiusXl,
    overflow: "hidden",
    marginBottom: spacing.spacing5,
    ...shadows.shadowHero,
  },
  banner: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
  },
  bannerImage: {
    resizeMode: "cover",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarWrapper: {
    position: "absolute",
    top: spacing.spacing4,
    left: spacing.spacing4,
    borderRadius: spacing.radiusFull,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.cardBackground,
    backgroundColor: colors.cardBackground,
    width: 64,
    height: 64,
    ...shadows.shadow2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: spacing.radiusFull,
  },
  textWrapper: {
    padding: spacing.spacing4,
  },
  name: {
    ...typography.heading2,
    color: colors.textOnPrimary,
  },
  location: {
    ...typography.small,
    color: colors.textOnPrimary,
    marginTop: 2,
  },
  description: {
    ...typography.small,
    color: colors.textOnPrimary,
    marginTop: spacing.spacing2,
  },
  ctaButton: {
    alignSelf: "flex-start",
    marginTop: spacing.spacing3,
    borderRadius: spacing.radiusFull,
  },
  ctaText: {
    ...typography.smallBold,
    color: colors.textOnPrimary,
    paddingVertical: spacing.spacing3,
    paddingHorizontal: spacing.spacing6,
  },
});

export default GymCard;
