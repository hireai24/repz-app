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
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { UserContext } from "../context/UserContext";
import { useTierAccess } from "../hooks/useTierAccess";
import { uploadFile } from "../utils/fileUploader";
import { saveNewUserPlan } from "../services/userPlanService";
import { analyzeProgressPhotos } from "../../ai/prompts/visualGains";
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
        setter(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Image picker error:", err.message);
      setErrorText(i18n.t("visual.errorUpload") || "Image upload failed.");
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
      setErrorText(i18n.t("visual.missingPhotos") || "Select before and after photos.");
      return;
    }

    setLoading(true);
    setErrorText("");
    setFeedback("");

    try {
      const token = await getAuthToken();

      const [beforeUpload, afterUpload] = await Promise.all([
        uploadImage(beforeImg, token),
        uploadImage(afterImg, token),
      ]);

      if (!beforeUpload?.url || !afterUpload?.url) {
        throw new Error("Image upload failed.");
      }

      const result = await analyzeProgressPhotos({
        weekStart: "Week 1",
        weekEnd: "Week 6",
        view,
        userGoal: userProfile.goal,
        before: beforeUpload.url,
        after: afterUpload.url,
        token,
      });

      const summary =
        result?.summary ||
        i18n.t("visual.noFeedback") ||
        "No feedback generated.";
      setFeedback(summary);

      await saveNewUserPlan({
        userId,
        name: `Visual Gains - ${view} View`,
        type: "Progress",
        exercises: [
          { day: "Before Photo", workout: beforeUpload.url },
          { day: "After Photo", workout: afterUpload.url },
          { day: "Feedback", workout: summary },
        ],
        createdAt: new Date().toISOString(),
        isPublic,
      });

      Alert.alert(
        i18n.t("visual.successTitle") || "Success!",
        i18n.t("visual.successMessage") || "Progress saved!",
      );
    } catch (error) {
      console.error("AI Analysis error:", error.message);
      setErrorText(
        i18n.t("visual.errorFallback") ||
          "AI analysis failed. Progress photos saved without feedback.",
      );

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
            { day: "Feedback", workout: "AI feedback unavailable." },
          ],
          createdAt: new Date().toISOString(),
          isPublic,
        });

        Alert.alert("Saved!", "Photos saved successfully, but no AI feedback available.");
      } catch (fallbackErr) {
        console.error("Fallback save failed:", fallbackErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>
          {i18n.t("visual.locked") || "Upgrade required to access Visual Gains."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{i18n.t("visual.title") || "Visual Gains"}</Text>

      <View style={styles.viewRow}>
        {views.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewBtn, view === v && styles.viewBtnActive]}
            onPress={() => setView(v)}
            accessibilityRole="button"
            accessibilityLabel={`${i18n.t("visual.selectView")}: ${v}`}
          >
            <Text style={view === v ? styles.viewTextActive : styles.viewText}>
              {i18n.t(`visual.${v.toLowerCase()}`) || v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.imageRow}>
        <TouchableOpacity
          onPress={() => pickImage(setBeforeImg)}
          style={styles.imageBox}
          accessibilityRole="imagebutton"
          accessibilityLabel={i18n.t("visual.uploadBefore")}
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
          accessibilityRole="imagebutton"
          accessibilityLabel={i18n.t("visual.uploadAfter")}
        >
          {afterImg ? (
            <Image source={{ uri: afterImg }} style={styles.image} />
          ) : (
            <Text style={styles.imageText}>{i18n.t("visual.after")}</Text>
          )}
        </TouchableOpacity>
      </View>

      {errorText !== "" && <Text style={styles.errorText}>{errorText}</Text>}

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
        <ActivityIndicator
          color={colors.primary}
          style={{ marginTop: spacing.md }}
        />
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

export default React.memo(VisualGainsScreen);
