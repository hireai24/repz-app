import React, { useState, useContext, useEffect } from "react"; // FIX: Added useEffect to import
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import PropTypes from "prop-types";
import { AuthContext } from "../context/AuthContext";
import { createGymFeedPost } from "../api/gymFeedApi";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymFeedEditorScreen = ({ route, navigation }) => {
  const { gymId } = route.params;
  const { isGymOwner, loading } = useContext(AuthContext);

  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [offer, setOffer] = useState("");

  // Handle loading state for AuthContext
  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  // Handle unauthorized access
  if (!isGymOwner) {
    // FIX: Activate the useEffect for automatic navigation
    useEffect(() => {
      const timer = setTimeout(() => {
        navigation.goBack(); // Or navigation.replace('HomeScreen')
      }, 3000); // Navigate back after 3 seconds
      return () => clearTimeout(timer);
    }, [navigation]);

    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.unauthorizedText}>Access Denied</Text>
        <Text style={styles.unauthorizedMessage}>
          Only gym owners can create or edit feed posts.
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          color={colors.accent}
        />
      </View>
    );
  }

  const handlePost = async () => {
    try {
      await createGymFeedPost({ gymId, text, imageUrl, offer });
      navigation.goBack();
    } catch (err) {
      // console.error("Failed to create feed post", err);
      alert("Failed to create feed post. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Text</Text>
      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Enter post text..."
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Image URL (optional)</Text>
      <TextInput
        style={styles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="e.g., https://example.com/image.jpg"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={styles.label}>Offer (optional)</Text>
      <TextInput
        style={styles.input}
        value={offer}
        onChangeText={setOffer}
        placeholder="e.g., 20% off personal training"
        placeholderTextColor={colors.textSecondary}
      />

      <Button title="Post" onPress={handlePost} color={colors.accent} />
    </View>
  );
};

GymFeedEditorScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      gymId: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  label: {
    ...typography.subheading,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  loadingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  unauthorizedMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  unauthorizedText: {
    ...typography.heading,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: "center",
  },
});

export default GymFeedEditorScreen;