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
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import FormFeedbackCard from "../components/FormFeedbackCard";
import { UserContext } from "../context/UserContext";
import { useTierAccess } from "../hooks/useTierAccess";
import { saveNewUserPlan } from "../services/userPlanService";
import { uploadFile } from "../utils/fileUploader";
import { uploadFormVideo } from "../api/formGhostApi";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const FormGhostScreen = () => {
  const { userProfile } = useContext(UserContext);
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
        analyzeUploadedVideo(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Video picker error:", err);
      setErrorText(i18n.t("form.uploadError"));
    }
  };

  const analyzeUploadedVideo = async (uri) => {
    setLoading(true);
    setErrorText("");
    setConfirmationText("");
    setAnalysis([]);

    try {
      const uploaded = await uploadFile({
        uri,
        type: "video",
        userId: userProfile?.id,
        endpoint: `${process.env.EXPO_PUBLIC_API_BASE_URL}/upload/video`,
      });

      if (!uploaded?.url) throw new Error("Upload failed");

      const result = await uploadFormVideo(userProfile.id, uploaded.url, "Squat");

      if (result?.results?.length > 0) {
        setAnalysis(result.results);

        await saveNewUserPlan({
          userId: userProfile.id,
          name: `Form Analysis - Squat`,
          type: "Form",
          exercises: result.results.map((rep, idx) => ({
            day: `Rep ${idx + 1}`,
            workout: rep.feedback?.comment || "Good form",
          })),
          createdAt: new Date().toISOString(),
          videoUrl: uploaded.url,
        });
      } else {
        setErrorText(i18n.t("form.noFeedback"));
      }
    } catch (err) {
      console.error("Video analysis error:", err);
      setErrorText(
        i18n.t("form.error") ||
        err.message ||
        "Something went wrong during analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setVideoUri(null);
    setAnalysis([]);
    setErrorText("");
    setConfirmationText("");
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleChallengeSubmit = () => {
    setConfirmationText(i18n.t("form.challengeSubmitted"));
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
          <Image
            source={{ uri: videoUri }}
            style={styles.thumbnail}
            onError={() => setVideoUri(null)}
          />
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
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  uploadBox: {
    backgroundColor: colors.surface,
    aspectRatio: 1.6,
    width: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  uploadText: {
    color: "#888",
    fontSize: 14,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  analysisBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  subTitle: {
    color: colors.success,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    color: colors.error,
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
  },
  confirmationText: {
    color: colors.success,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.md,
  },
});

export default FormGhostScreen;
