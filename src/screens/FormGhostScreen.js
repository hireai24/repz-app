// src/screens/FormGhostScreen.js

import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import FormFeedbackCard from "../components/FormFeedbackCard";
import { UserContext } from "../context/UserContext";
import useTierAccess from "../hooks/useTierAccess";
import { saveNewUserPlan } from "../services/userPlanService";
import { uploadFormVideo } from "../api/formGhostApi";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

import ghostIcon from "../assets/icons/ghost.png";
import uploadIcon from "../assets/icons/upload-btn.png";

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
      setErrorText(
        i18n.t("form.uploadError") + (err.message ? `: ${err.message}` : "")
      );
      Alert.alert(i18n.t("common.error"), i18n.t("form.uploadError"));
    }
  };

  const analyzeUploadedVideo = async (localUri) => {
    setLoading(true);
    setErrorText("");
    setConfirmationText("");
    setAnalysis([]);

    if (!userProfile?.id) {
      setErrorText(i18n.t("form.userError"));
      setLoading(false);
      Alert.alert(i18n.t("common.error"), i18n.t("form.userError"));
      return;
    }

    try {
      const result = await uploadFormVideo(userProfile.id, localUri, "Squat");

      if (result?.success && result.results?.length > 0) {
        setAnalysis(result.results);
        setConfirmationText(i18n.t("form.analysisSuccess"));

        await saveNewUserPlan({
          userId: userProfile.id,
          name: `Form Analysis - Squat (${new Date().toLocaleDateString()})`,
          type: "Form Analysis",
          exercises: result.results.map((rep, idx) => ({
            name: `Rep ${idx + 1}`,
            feedback: rep.feedback?.comment || "No comment",
            score: rep.feedback?.score || "N/A",
          })),
          createdAt: new Date().toISOString(),
          videoUrl: localUri,
        });
      } else {
        setErrorText(result?.error || i18n.t("form.noFeedback"));
      }
    } catch (err) {
      setErrorText(err.message || i18n.t("form.error"));
      Alert.alert(i18n.t("common.error"), err.message || i18n.t("form.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setVideoUri(null);
    setAnalysis([]);
    setErrorText("");
    setConfirmationText("");
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleChallengeSubmit = () => {
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
      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={ghostIcon} style={styles.ghostIcon} />
        <Text style={styles.title}>{i18n.t("form.title")}</Text>
      </View>

      {/* Upload */}
      <TouchableOpacity
        style={styles.uploadBox}
        onPress={pickVideo}
        accessibilityRole="button"
        accessibilityLabel={i18n.t("form.upload")}
      >
        {videoUri ? (
          <Text style={styles.uploadText}>
            🎥 {videoUri.split("/").pop()}
          </Text>
        ) : (
          <>
            <Image source={uploadIcon} style={styles.uploadIcon} />
            <Text style={styles.uploadText}>{i18n.t("form.upload")}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Status */}
      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
      {!!confirmationText && (
        <Text style={styles.confirmationText}>{confirmationText}</Text>
      )}

      {loading && (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      )}

      {/* Analysis */}
      {analysis.length > 0 && (
        <View style={styles.analysisBlock}>
          <Text style={styles.subTitle}>{i18n.t("form.analysis")}</Text>
          {analysis.map((rep, index) => (
            <FormFeedbackCard key={index} rep={rep.feedback} />
          ))}
        </View>
      )}

      {/* No Analysis */}
      {!loading && analysis.length === 0 && videoUri && (
        <Text style={styles.emptyState}>{i18n.t("form.noFeedback")}</Text>
      )}

      {/* Challenge CTA */}
      {analysis.length > 0 && (
        <TouchableOpacity
          style={styles.cta}
          onPress={handleChallengeSubmit}
          accessibilityRole="button"
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
    flexGrow: 1,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  ghostIcon: {
    width: 28,
    height: 28,
    marginRight: spacing.sm,
    opacity: 0.85,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  uploadBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glassBackground,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  uploadIcon: {
    width: 36,
    height: 36,
    marginBottom: spacing.xs,
  },
  uploadText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  confirmationText: {
    color: colors.success,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  loading: {
    marginTop: spacing.md,
  },
  analysisBlock: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  subTitle: {
    ...typography.heading3,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  ctaText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  lockedText: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 16,
  },
});

export default React.memo(FormGhostScreen);
