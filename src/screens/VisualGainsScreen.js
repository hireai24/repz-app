// src/screens/VisualGainsScreen.js

import React, { useState, useContext } from "react";
import PropTypes from "prop-types"; // ✅ Add this line
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
import useTierAccess from "../hooks/useTierAccess";
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
    } catch {
      setErrorText(i18n.t("visual.errorUpload"));
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
        throw new Error(i18n.t("visual.errorUpload"));
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
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || i18n.t("visual.errorFallback"));

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
      Alert.alert(i18n.t("common.error"), err.message);
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
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../assets/icons/ghost.png")}
          style={styles.ghostIcon}
        />
        <Text style={styles.title}>{i18n.t("visual.title")}</Text>
      </View>

      {/* View Selector */}
      <View style={styles.viewRow}>
        {views.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewBtn, view === v && styles.viewBtnActive]}
            onPress={() => setView(v)}
          >
            <Text style={view === v ? styles.viewTextActive : styles.viewText}>
              {i18n.t(`visual.${v.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Image Upload */}
      <View style={styles.imageRow}>
        <UploadImageBox
          label={i18n.t("visual.before")}
          imageUri={beforeImg}
          onPick={() => pickImage(setBeforeImg)}
        />
        <UploadImageBox
          label={i18n.t("visual.after")}
          imageUri={afterImg}
          onPick={() => pickImage(setAfterImg)}
        />
      </View>

      {/* Error and Success */}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      {/* Analyze Button */}
      {beforeImg && afterImg && (
        <TouchableOpacity
          style={[
            styles.analyzeBtn,
            loading && styles.analyzeBtnDisabled,
          ]}
          onPress={handleAnalyze}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("visual.analyze")}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.analyzeText}>{i18n.t("visual.analyze")}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Feedback */}
      {feedback && (
        <View style={styles.resultBlock}>
          <Image
            source={require("../assets/icons/ghost.png")}
            style={styles.watermark}
          />
          <Text style={styles.resultTitle}>{i18n.t("visual.feedback")}</Text>
          <Text style={styles.resultText}>{feedback}</Text>
        </View>
      )}

      {/* Public Toggle */}
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

const UploadImageBox = ({ label, imageUri, onPick }) => (
  <TouchableOpacity
    style={styles.imageBox}
    onPress={onPick}
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    {imageUri ? (
      <Image source={{ uri: imageUri }} style={styles.image} />
    ) : (
      <>
        <Image
          source={require("../assets/icons/upload-btn.png")}
          style={styles.uploadIcon}
        />
        <Text style={styles.imageText}>{label}</Text>
      </>
    )}
  </TouchableOpacity>
);

UploadImageBox.propTypes = {
  label: PropTypes.string.isRequired,
  imageUri: PropTypes.string,
  onPick: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  ghostIcon: {
    width: 28,
    height: 28,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  viewRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: spacing.md,
  },
  viewBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xs,
  },
  viewBtnActive: {
    backgroundColor: colors.primary,
  },
  viewText: {
    color: colors.textSecondary,
  },
  viewTextActive: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  imageBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 8,
  },
  uploadIcon: {
    width: 32,
    height: 32,
    marginBottom: spacing.xs,
  },
  imageText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  successText: {
    color: colors.success,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  analyzeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginVertical: spacing.md,
  },
  analyzeBtnDisabled: {
    opacity: 0.6,
  },
  analyzeText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  resultBlock: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.lg,
    position: "relative",
  },
  resultTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resultText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  watermark: {
    position: "absolute",
    opacity: 0.05,
    top: spacing.md,
    right: spacing.md,
    width: 64,
    height: 64,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 14,
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
  },
});

export default React.memo(VisualGainsScreen);
