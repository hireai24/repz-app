// src/screens/GymProfileScreen.js
import React from "react";
import PropTypes from "prop-types";
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

GymProfileScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      gym: PropTypes.shape({
        image: PropTypes.string,
        name: PropTypes.string,
        location: PropTypes.string,
        description: PropTypes.string,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  image: {
    borderRadius: 10,
    height: 180,
    marginBottom: spacing.md,
    width: "100%",
  },
  location: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
});

export default GymProfileScreen;
