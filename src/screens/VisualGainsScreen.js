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
    } catch (err) {
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
      <View style={styles.header}>
        <Image
          source={require("../assets/icons/ghost.png")}
          style={styles.ghostIcon}
        />
        <Text style={styles.title}>{i18n.t("visual.title")}</Text>
      </View>

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

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      {beforeImg && afterImg && (
        <TouchableOpacity
          style={[
            styles.analyzeBtn,
            loading && styles.analyzeBtnDisabled,
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
          <Image
            source={require("../assets/icons/ghost.png")}
            style={styles.watermark}
          />
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

const UploadImageBox = ({ label, imageUri, onPick }) => (
  <TouchableOpacity style={styles.imageBox} onPress={onPick}>
    {imageUri ? (
      <Image source={{ uri: imageUri }} style={styles.image} />
    ) : (
      <Image
        source={require("../assets/icons/upload-btn.png")}
        style={styles.uploadIcon}
      />
    )}
    {!imageUri && <Text style={styles.imageText}>{label}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  // ... all styles unchanged except new watermark, header, uploadIcon
  ghostIcon: {
    width: 32,
    height: 32,
    marginRight: spacing.sm,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  watermark: {
    position: "absolute",
    opacity: 0.05,
    top: spacing.md,
    right: spacing.md,
    width: 64,
    height: 64,
  },
  uploadIcon: {
    width: 32,
    height: 32,
    marginBottom: spacing.xs,
  },
  // ... other styles remain as you had them
});

export default React.memo(VisualGainsScreen);
