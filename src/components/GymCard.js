// src/components/GymCard.js
import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
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
    >
      <Image source={{ uri: gym.image }} style={styles.image} />
      <Text style={styles.name}>{gym.name}</Text>
      <Text style={styles.location}>{gym.location}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  image: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.heading4,
    color: colors.textPrimary,
  },
  location: {
    ...typography.small,
    color: colors.textSecondary,
  },
});

export default GymCard;
