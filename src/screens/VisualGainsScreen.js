import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { UserContext } from "../context/UserContext";
import { useTierAccess } from "../hooks/useTierAccess";
import { uploadFile } from "../utils/fileUploader";
import { saveNewUserPlan } from "../services/userPlanService";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const views = ["Front", "Side", "Back"];

const VisualGainsScreen = () => {
  const { userProfile, userId } = useContext(UserContext);
  const { locked } = useTierAccess("Pro");

  const [beforeImg, setBeforeImg] = useState(null);
  const [afterImg, setAfterImg] = useState(null);
  const [view, setView] = useState("Front");
  const [isPublic, setIsPublic] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const getAuthToken = useCallback(async () => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("Missing auth token");
    return token;
  }, []);

  const pickImage = async (setter) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setErrorText("");
        setSuccessMessage("");
        setter(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Image picker error:", err.message);
      setErrorText(i18n.t("visual.errorUpload"));
    }
  };

  const uploadImage = async (uri, token) => {
    return uploadFile({
      uri,
      type: "image",
      userId: userProfile?.id || userId,
      endpoint: `${process.env.EXPO_PUBLIC_API_BASE_URL}/upload/photo`,
      token,
    });
  };

  const handleAnalyze = async () => {
    if (!beforeImg || !afterImg) {
      setErrorText(i18n.t("visual.missingPhotos"));
      return;
    }

    setLoading(true);
    setErrorText("");
    setFeedback("");
    setSuccessMessage("");

    try {
      const token = await getAuthToken();

      const [beforeUpload, afterUpload] = await Promise.all([
        uploadImage(beforeImg, token),
        uploadImage(afterImg, token),
      ]);

      if (!beforeUpload?.url || !afterUpload?.url) {
        throw new Error("Image upload failed.");
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/photo-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            beforeUrl: beforeUpload.url,
            afterUrl: afterUpload.url,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Photo analysis failed.");

      setFeedback(data.message || i18n.t("visual.noFeedback"));
      setSuccessMessage(i18n.t("visual.successMessage"));

      await saveNewUserPlan({
        userId,
        name: `Visual Gains - ${view} View`,
        type: "Progress",
        exercises: [
          { day: "Before Photo", workout: beforeUpload.url },
          { day: "After Photo", workout: afterUpload.url },
          { day: "Feedback", workout: data.message },
        ],
        createdAt: new Date().toISOString(),
        isPublic,
      });
    } catch (error) {
      console.error("Replicate analysis error:", error.message);
      setErrorText(i18n.t("visual.errorFallback"));

      try {
        const token = await getAuthToken();
        const [beforeFallback, afterFallback] = await Promise.all([
          uploadImage(beforeImg, token),
          uploadImage(afterImg, token),
        ]);

        await saveNewUserPlan({
          userId,
          name: `Visual Gains - ${view} View`,
          type: "Progress",
          exercises: [
            { day: "Before Photo", workout: beforeFallback.url },
            { day: "After Photo", workout: afterFallback.url },
            { day: "Feedback", workout: i18n.t("visual.noAI") },
          ],
          createdAt: new Date().toISOString(),
          isPublic,
        });

        setSuccessMessage(i18n.t("visual.fallbackSaved"));
      } catch (fallbackErr) {
        console.error("Fallback save failed:", fallbackErr.message);
        setErrorText(i18n.t("visual.saveFail"));
      }
    } finally {
      setLoading(false);
    }
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t("visual.locked")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{i18n.t("visual.title")}</Text>

      <View style={styles.viewRow}>
        {views.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewBtn, view === v && styles.viewBtnActive]}
            onPress={() => setView(v)}
            accessibilityRole="button"
          >
            <Text style={view === v ? styles.viewTextActive : styles.viewText}>
              {i18n.t(`visual.${v.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.imageRow}>
        <TouchableOpacity
          onPress={() => pickImage(setBeforeImg)}
          style={styles.imageBox}
        >
          {beforeImg ? (
            <Image source={{ uri: beforeImg }} style={styles.image} />
          ) : (
            <Text style={styles.imageText}>{i18n.t("visual.before")}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickImage(setAfterImg)}
          style={styles.imageBox}
        >
          {afterImg ? (
            <Image source={{ uri: afterImg }} style={styles.image} />
          ) : (
            <Text style={styles.imageText}>{i18n.t("visual.after")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      {beforeImg && afterImg && (
        <TouchableOpacity
          style={styles.analyzeBtn}
          onPress={handleAnalyze}
          disabled={loading}
        >
          <Text style={styles.analyzeText}>
            {loading ? i18n.t("common.loading") : i18n.t("visual.analyze")}
          </Text>
        </TouchableOpacity>
      )}

      {loading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      )}

      {feedback && (
        <View style={styles.resultBlock}>
          <Text style={styles.resultTitle}>{i18n.t("visual.feedback")}</Text>
          <Text style={styles.resultText}>{feedback}</Text>
        </View>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{i18n.t("visual.makePublic")}</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: "#777", true: colors.success }}
          thumbColor={isPublic ? colors.primary : "#ccc"}
        />
      </View>
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
  viewRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  viewBtn: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  viewBtnActive: {
    backgroundColor: colors.primary,
  },
  viewText: {
    color: colors.textSecondary,
  },
  viewTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  imageBox: {
    flex: 1,
    aspectRatio: 0.8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  analyzeBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: "center",
    marginTop: spacing.md,
  },
  analyzeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultBlock: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  resultTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  resultText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
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
});

export default React.memo(VisualGainsScreen);
