import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert, // ADDED: For user-facing alerts
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import FormFeedbackCard from "../components/FormFeedbackCard";
import { UserContext } from "../context/UserContext";
import { useTierAccess } from "../hooks/useTierAccess";
import { saveNewUserPlan } from "../services/userPlanService";
// REMOVED: import { uploadFile } from "../utils/fileUploader"; // No longer pre-uploading to Firebase Storage here
import { uploadFormVideo } from "../api/formGhostApi";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const FormGhostScreen = () => {
  const { userProfile } = useContext(UserContext); // userProfile has id
  const { locked } = useTierAccess("Pro");

  const [videoUri, setVideoUri] = useState(null);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setErrorText("");
        setConfirmationText("");
        setVideoUri(result.assets[0].uri);
        // Call analysis directly with local URI
        analyzeUploadedVideo(result.assets[0].uri);
      }
    } catch (err) {
      setErrorText(i18n.t("form.uploadError") + (err.message ? `: ${err.message}` : ""));
      Alert.alert(i18n.t("common.error"), i18n.t("form.uploadError"));
    }
  };

  // Renamed to clarify it takes local URI
  const analyzeUploadedVideo = async (localUri) => { // CHANGED: Takes localUri directly
    setLoading(true);
    setErrorText("");
    setConfirmationText("");
    setAnalysis([]);

    if (!userProfile?.id) {
        setErrorText("User profile not loaded. Cannot analyze form.");
        setLoading(false);
        Alert.alert(i18n.t("common.error"), "User profile not loaded. Please try again.");
        return;
    }

    try {
      // Direct call to formGhostApi to upload and analyze
      const result = await uploadFormVideo( // Now sends the local video data
        userProfile.id,
        localUri, // Pass local URI
        "Squat", // Exercise type needs to be passed, current hardcoded "Squat"
      );

      if (result?.success && result.results?.length > 0) {
        setAnalysis(result.results);
        setConfirmationText(i18n.t("form.analysisSuccess")); // New text for success

        // Save analysis to user's plans
        await saveNewUserPlan({
          userId: userProfile.id,
          name: `Form Analysis - Squat (${new Date().toLocaleDateString()})`, // Dynamic name
          type: "Form Analysis", // More specific type
          exercises: result.results.map((rep, idx) => ({ // Assuming 'rep' is the structure for each rep
            name: `Rep ${idx + 1}`,
            feedback: rep.feedback?.comment || "No comment", // Ensure proper path to feedback
            score: rep.feedback?.score || 'N/A'
          })),
          createdAt: new Date().toISOString(),
          videoUrl: localUri, // Save original local URI or a persistent URL if re-uploaded for storage
        });
      } else {
        setErrorText(result?.error || i18n.t("form.noFeedback"));
      }
    } catch (err) {
      setErrorText(
        i18n.t("form.error") ||
          err.message ||
          "Something went wrong during analysis.",
      );
      Alert.alert(i18n.t("common.error"), err.message || i18n.t("form.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => { // Wrap in useCallback
    setRefreshing(true);
    setVideoUri(null);
    setAnalysis([]);
    setErrorText("");
    setConfirmationText("");
    // After states are reset, simulate async refresh and then set refreshing to false
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleChallengeSubmit = () => {
    // Implement logic to submit to challenge, e.g., navigate to ChallengeSetupScreen
    // with videoUri and analysis results.
    setConfirmationText(i18n.t("form.challengeSubmitted"));
    Alert.alert(i18n.t("form.challenge"), i18n.t("form.challengeSubmitted"));
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t("form.locked")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <Text style={styles.title}>{i18n.t("form.title")}</Text>

      <TouchableOpacity
        style={styles.uploadBox}
        onPress={pickVideo}
        accessibilityRole="button"
        accessibilityLabel={i18n.t("form.upload")}
      >
        {videoUri ? (
          // Consider using Expo-AV or Video component for video thumbnail preview
          <Text style={styles.uploadText}>Video Selected: {videoUri.split('/').pop()}</Text>
          // <Image
          //   source={{ uri: videoUri }}
          //   style={styles.thumbnail}
          //   onError={() => setVideoUri(null)}
          // />
        ) : (
          <Text style={styles.uploadText}>{i18n.t("form.upload")}</Text>
        )}
      </TouchableOpacity>

      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
      {!!confirmationText && (
        <Text style={styles.confirmationText}>{confirmationText}</Text>
      )}

      {loading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: spacing.md }}
        />
      )}

      {analysis.length > 0 && (
        <View style={styles.analysisBlock}>
          <Text style={styles.subTitle}>{i18n.t("form.analysis")}</Text>
          {analysis.map((rep, index) => (
            <FormFeedbackCard key={index} rep={rep.feedback} />
          ))}
        </View>
      )}

      {!loading && analysis.length === 0 && videoUri && (
        <Text style={styles.emptyState}>{i18n.t("form.noFeedback")}</Text>
      )}

      {analysis.length > 0 && (
        <TouchableOpacity
          style={styles.cta}
          onPress={handleChallengeSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit Challenge"
        >
          <Text style={styles.ctaText}>{i18n.t("form.challenge")}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  analysisBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  confirmationText: {
    color: colors.success,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  container: {
    backgroundColor: colors.background,
    flexGrow: 1, // Use flexGrow for ScrollView contentContainerStyle
    padding: spacing.lg,
  },
  cta: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  ctaText: {
    color: colors.white,
    fontWeight: "bold",
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  lockedContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  subTitle: {
    color: colors.success,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  thumbnail: {
    height: "100%",
    width: "100%",
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  uploadBox: {
    alignItems: "center",
    aspectRatio: 1.6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
    width: "100%",
  },
  uploadText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
});

export default FormGhostScreen;