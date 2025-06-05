import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
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
      setErrorText(
        i18n.t("visual.errorUpload") + (err.message ? `: ${err.message}` : ""),
      );
      Alert.alert(i18n.t("common.error"), i18n.t("visual.errorUpload"));
    }
  };

  const uploadImage = async (uri) => {
    if (!userProfile?.id && !userId) {
      throw new Error("User ID not available for upload.");
    }
    return uploadFile({
      uri,
      type: "image",
      userId: userProfile?.id || userId,
      pathPrefix: "progress-photos",
    });
  };

  const handleAnalyze = async () => {
    if (!beforeImg || !afterImg) {
      setErrorText(i18n.t("visual.missingPhotos"));
      Alert.alert(i18n.t("common.error"), i18n.t("visual.missingPhotos"));
      return;
    }

    setLoading(true);
    setErrorText("");
    setFeedback("");
    setSuccessMessage("");

    try {
      const [beforeUpload, afterUpload] = await Promise.all([
        uploadImage(beforeImg),
        uploadImage(afterImg),
      ]);

      if (!beforeUpload?.url || !afterUpload?.url) {
        throw new Error(i18n.t("visual.errorUpload") || "Image upload failed.");
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/photo-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await AsyncStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            beforeUrl: beforeUpload.url,
            afterUrl: afterUpload.url,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || i18n.t("visual.errorFallback"));

      setFeedback(data.message || i18n.t("visual.noFeedback"));
      setSuccessMessage(i18n.t("visual.successMessage"));

      await saveNewUserPlan({
        userId: userId || userProfile?.id,
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
    } catch (err) {
      setErrorText(err.message || i18n.t("visual.errorFallback"));
      Alert.alert(
        i18n.t("common.error"),
        err.message || i18n.t("visual.errorFallback"),
      );
      try {
        await saveNewUserPlan({
          userId: userId || userProfile?.id,
          name: `Visual Gains - ${view} View (Failed AI)`,
          type: "Progress",
          exercises: [
            { day: "Before Photo", workout: beforeImg },
            { day: "After Photo", workout: afterImg },
            { day: "Feedback", workout: i18n.t("visual.noAI") },
          ],
          createdAt: new Date().toISOString(),
          isPublic,
        });

        setSuccessMessage(i18n.t("visual.fallbackSaved"));
      } catch (saveErr) {
        setErrorText(
          i18n.t("visual.saveFail") +
            (saveErr.message ? `: ${saveErr.message}` : ""),
        );
        Alert.alert(i18n.t("common.error"), i18n.t("visual.saveFail"));
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
          style={[
            styles.analyzeBtn,
            loading ? styles.analyzeBtnDisabled : null,
          ]}
          onPress={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.analyzeText}>{i18n.t("visual.analyze")}</Text>
          )}
        </TouchableOpacity>
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
          trackColor={{ false: colors.border, true: colors.success }}
          thumbColor={isPublic ? colors.primary : colors.surface}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  analyzeBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  analyzeBtnDisabled: {
    opacity: 0.5, // Fix for inline style error
  },
  analyzeText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  imageBox: {
    alignItems: "center",
    aspectRatio: 0.8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  imageRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  imageText: {
    color: colors.textSecondary,
    fontSize: 13,
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
  resultBlock: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  resultText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  resultTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  viewBtn: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewBtnActive: {
    backgroundColor: colors.primary,
  },
  viewRow: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  viewText: {
    color: colors.textSecondary,
  },
  viewTextActive: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
});

export default React.memo(VisualGainsScreen);
