import React from "react";
import PropTypes from "prop-types";
import { Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymCard = ({ gym }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    // FIX: Changed navigation target to 'GymProfileScreen'
    navigation.navigate("GymProfileScreen", { gym });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`View gym profile for ${gym.name}`}
    >
      <Image
        source={{ uri: gym.image }}
        style={styles.image}
        accessibilityLabel={`Gym photo for ${gym.name}`}
      />
      <Text style={styles.name}>{gym.name}</Text>
      <Text style={styles.location}>{gym.location}</Text>

      {gym.memberCount ? (
        <Text style={styles.detail}>{gym.memberCount} members</Text>
      ) : null}

      {gym.features ? (
        <Text style={styles.detail} numberOfLines={1} ellipsizeMode="tail">
          {gym.features}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
};

GymCard.propTypes = {
  gym: PropTypes.shape({
    image: PropTypes.string, // FIX: Made optional, as image might be missing. If required, enforce validation.
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    memberCount: PropTypes.oneOfType([
      // FIX: Added number type as well
      PropTypes.string,
      PropTypes.number,
    ]),
    features: PropTypes.string,
  }).isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    elevation: 2,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  detail: {
    ...typography.small,
    color: colors.textTertiary,
  },
  image: {
    borderRadius: 10,
    height: 120,
    marginBottom: spacing.sm,
    width: "100%",
  },
  location: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  name: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: 2,
  },
});

export default GymCard;
