// src/screens/GymProfileScreen.js
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymProfileScreen = ({ route }) => {
  const { gym } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: gym.image }} style={styles.image} />
      <Text style={styles.name}>{gym.name}</Text>
      <Text style={styles.location}>{gym.location}</Text>
      <Text style={styles.description}>{gym.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  location: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
});

export default GymProfileScreen;
