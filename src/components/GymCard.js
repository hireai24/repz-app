// src/components/GymCard.js
import React from "react";
import PropTypes from "prop-types";
import { Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymCard = ({ gym }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("GymProfile", { gym })}
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
    </TouchableOpacity>
  );
};

GymCard.propTypes = {
  gym: PropTypes.shape({
    image: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: spacing.md,
    padding: spacing.md,
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
  },
  name: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
});

export default GymCard;
