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
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

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
      activeOpacity={0.8}
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
        <View style={styles.overlay} />
        <View style={styles.avatarWrapper}>
          <Image
            source={
              gym.logo
                ? { uri: gym.logo }
                : fallbackIcon
            }
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
          <TouchableOpacity
            style={styles.ctaButton}
            accessibilityRole="button"
            accessibilityLabel="Visit Gym"
          >
            <Text style={styles.ctaText}>Visit Gym</Text>
          </TouchableOpacity>
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
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  banner: {
    width: "100%",
    height: 180,
    justifyContent: "flex-end",
  },
  bannerImage: {
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  avatarWrapper: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatar: {
    width: 48,
    height: 48,
  },
  textWrapper: {
    padding: spacing.md,
  },
  name: {
    ...typography.heading3,
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
    marginTop: spacing.xs,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    borderRadius: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  ctaText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    fontSize: 13,
  },
});

export default GymCard;
