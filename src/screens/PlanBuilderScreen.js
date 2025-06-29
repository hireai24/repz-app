// src/screens/PlanBuilderScreen.js

import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { UserContext } from "../context/UserContext";
import useTierAccess from "../hooks/useTierAccess";
import useFadeIn from "../animations/fadeIn";
import { generateWorkoutPlan as callGenerateWorkoutAPI } from "../api/workoutApi";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const goals = ["Fat Loss", "Muscle Gain", "Strength", "Athletic"];
const splits = ["Push/Pull/Legs", "Full Body", "Upper/Lower", "Bro Split"];

const PlanBuilderScreen = () => {
  const fadeAnim = useFadeIn(100);
  const { locked } = useTierAccess("Pro");
  const { userProfile, userId } = useContext(UserContext);

  const [goal, setGoal] = useState("");
  const [split, setSplit] = useState("");
  const [days, setDays] = useState(4);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState([]);
  const [error, setError] = useState("");

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setVideo(result.assets[0].uri);
      }
    } catch {
      Alert.alert(i18n.t("common.error"), i18n.t("form.uploadError"));
    }
  };

  const generatePlan = async () => {
    if (!goal || !split || !days) {
      Alert.alert(i18n.t("common.error"), i18n.t("plan.missing"));
      return;
    }

    setLoading(true);
    setError("");
    setPlan([]);

    try {
      const res = await callGenerateWorkoutAPI({
        userId,
        fitnessGoal: goal,
        equipment: userProfile?.equipment || [],
        injuries: userProfile?.injuries || [],
        availableDays: days,
        preferredSplit: split,
        experienceLevel: userProfile?.experience || "Intermediate",
      });

      if (res.success && res.plan) {
        setPlan(res.plan);
        Alert.alert(i18n.t("plan.successTitle"), i18n.t("plan.successMessage"));
      } else {
        throw new Error(res.error || i18n.t("plan.error"));
      }
    } catch (err) {
      setError(err.message || i18n.t("plan.error"));
      Alert.alert(i18n.t("common.error"), err.message || i18n.t("plan.error"));
    } finally {
      setLoading(false);
    }
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t("plan.locked")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={require("../assets/plan-bg-gradient.png")}
        style={styles.headerImage}
        resizeMode="cover"
      />

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>{i18n.t("plan.title")}</Text>

        {/* Goal Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("plan.goal")}</Text>
          <View style={styles.optionsRow}>
            {goals.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.option, goal === g && styles.optionActive]}
                onPress={() => setGoal(g)}
                accessibilityRole="button"
                accessibilityLabel={`Select goal: ${g}`}
              >
                <Text style={goal === g ? styles.optionTextActive : styles.optionText}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Split Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("plan.split")}</Text>
          <View style={styles.optionsRow}>
            {splits.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.option, split === s && styles.optionActive]}
                onPress={() => setSplit(s)}
                accessibilityRole="button"
                accessibilityLabel={`Select split: ${s}`}
              >
                <Text style={split === s ? styles.optionTextActive : styles.optionText}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Days Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("plan.days")}</Text>
          <View style={styles.optionsRow}>
            {[3, 4, 5, 6].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.option, days === n && styles.optionActive]}
                onPress={() => setDays(n)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${n} days`}
              >
                <Text style={days === n ? styles.optionTextActive : styles.optionText}>
                  {n} {i18n.t("plan.daysShort")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Video Upload */}
        <View style={styles.section}>
          <Text style={styles.label}>{i18n.t("plan.videoNote")}</Text>
          <TouchableOpacity
            style={styles.videoBtn}
            onPress={pickVideo}
            accessibilityRole="button"
            accessibilityLabel="Upload technique video"
          >
            <Image
              source={require("../assets/icons/video-icon.png")}
              style={styles.videoIcon}
            />
            <Text style={styles.videoText}>
              {video ? i18n.t("plan.videoSelected") : i18n.t("plan.uploadVideo")}
            </Text>
          </TouchableOpacity>
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.disabledGenerateBtn]}
          onPress={generatePlan}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Generate AI Workout Plan"
          testID="generate-plan-button"
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.generateText}>{i18n.t("plan.generate")}</Text>
          )}
        </TouchableOpacity>

        {plan && plan.length > 0 && (
          <View style={styles.planBox}>
            <Text style={styles.planTitle}>{i18n.t("plan.aiGenerated")}</Text>
            {plan.map((dayBlock, index) => (
              <View key={index} style={styles.dayBlock}>
                <Text style={styles.dayTitle}>{dayBlock.day}</Text>
                {dayBlock.exercises.map((exercise, idx) => (
                  <Text key={idx} style={styles.workoutText}>
                    {exercise.name}: {exercise.details}
                  </Text>
                ))}
              </View>
            ))}
            <TouchableOpacity
              style={styles.startBtn}
              accessibilityRole="button"
              accessibilityLabel="Start this workout plan today"
            >
              <Text style={styles.startText}>{i18n.t("plan.startToday")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },
  headerImage: {
    width: "100%",
    height: 120,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  videoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
  },
  videoIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
  },
  videoText: {
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  disabledGenerateBtn: {
    opacity: 0.6,
  },
  generateText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  planBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  planTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  dayBlock: {
    marginBottom: spacing.md,
  },
  dayTitle: {
    color: colors.success,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  workoutText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  startBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    marginTop: spacing.md,
    padding: spacing.md,
    alignItems: "center",
  },
  startText: {
    color: colors.textOnSuccess,
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
    fontSize: 16,
    textAlign: "center",
  },
});

export default PlanBuilderScreen;
