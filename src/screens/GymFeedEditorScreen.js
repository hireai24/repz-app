// src/screens/GymFeedEditorScreen.js

import React, { useState, useContext, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
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
  const [shouldGoBack, setShouldGoBack] = useState(false);

  useEffect(() => {
    if (!isGymOwner && !loading) {
      const timer = setTimeout(() => setShouldGoBack(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isGymOwner, loading]);

  useEffect(() => {
    if (shouldGoBack) {
      navigation.goBack();
    }
  }, [shouldGoBack, navigation]);

  const handlePost = async () => {
    try {
      await createGymFeedPost({ gymId, text, imageUrl, offer });
      navigation.goBack();
    } catch {
      alert("Failed to create feed post. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  if (!isGymOwner) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.unauthorizedText}>Access Denied</Text>
        <Text style={styles.unauthorizedMessage}>
          Only gym owners can create or edit feed posts.
        </Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Post</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Post Text</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          multiline
          value={text}
          onChangeText={setText}
          placeholder="Enter post text..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Image URL (optional)</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="e.g., https://example.com/image.jpg"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Offer (optional)</Text>
        <TextInput
          style={styles.input}
          value={offer}
          onChangeText={setOffer}
          placeholder="e.g., 20% off personal training"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handlePost}>
        <Text style={styles.submitButtonText}>Post</Text>
      </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subheading,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    padding: spacing.md,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  submitButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingText: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  unauthorizedText: {
    ...typography.heading3,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  unauthorizedMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  goBackButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  goBackText: {
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
});

export default GymFeedEditorScreen;
