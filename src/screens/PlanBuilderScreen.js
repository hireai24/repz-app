import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput, // Assuming TextInput might be used for custom inputs if you expand this
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";

import { UserContext } from "../context/UserContext"; // UserContext contains userProfile
import { useTierAccess } from "../hooks/useTierAccess";
import useFadeIn from "../animations/fadeIn";
import { saveNewUserPlan } from "../services/userPlanService"; // Still used for saving to local storage/Firestore
import { generateWorkoutPlan as callGenerateWorkoutAPI } from "../api/workoutApi"; // NEW: Import API call from workoutApi
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const goals = ["Fat Loss", "Muscle Gain", "Strength", "Athletic"];
const splits = ["Push/Pull/Legs", "Full Body", "Upper/Lower", "Bro Split"];

const PlanBuilderScreen = () => {
  const fadeAnim = useFadeIn(100);
  const { locked } = useTierAccess("Pro"); // Access check should also happen in backend
  const { userProfile, userId } = useContext(UserContext); // userProfile has injuries, equipment, experienceLevel

  const [goal, setGoal] = useState("");
  const [split, setSplit] = useState("");
  const [days, setDays] = useState(4);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null); // This is the structured plan from AI
  const [error, setError] = useState("");

  const generatePlan = async () => {
    if (!goal || !split || !days) {
      Alert.alert(i18n.t("common.error"), i18n.t("plan.missing")); // Use Alert for user-facing errors
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null); // Clear previous plan

    try {
      // Call your backend API endpoint for workout generation
      const res = await callGenerateWorkoutAPI({ // Using imported API call
        userId,
        fitnessGoal: goal, // Backend expects fitnessGoal
        equipment: userProfile?.equipment || [], // Pass as array if backend handles
        injuries: userProfile?.injuries || [], // Pass as array if backend handles
        availableDays: days,
        preferredSplit: split,
        experienceLevel: userProfile?.experience || "Intermediate",
      });

      if (res.success && res.plan) { // Backend now returns plan directly
        setPlan(res.plan); // Set the structured plan from backend
        // Save to userPlans collection via backend too (handled by generateWorkout.js itself)
        // No need to call saveNewUserPlan separately here as generateWorkout.js already does it.
        Alert.alert(
          i18n.t("plan.successTitle"),
          i18n.t("plan.successMessage"),
        );
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
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>{i18n.t("plan.title")}</Text>

        <Text style={styles.label}>{i18n.t("plan.goal")}</Text>
        <View style={styles.optionsRow}>
          {goals.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGoal(g)}
              style={[styles.option, goal === g && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: goal === g }}
            >
              <Text
                style={goal === g ? styles.optionTextActive : styles.optionText}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{i18n.t("plan.split")}</Text>
        <View style={styles.optionsRow}>
          {splits.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSplit(s)}
              style={[styles.option, split === s && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: split === s }}
            >
              <Text
                style={
                  split === s ? styles.optionTextActive : styles.optionText
                }
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{i18n.t("plan.days")}</Text>
        <View style={styles.optionsRow}>
          {[3, 4, 5, 6].map((n) => (
            <TouchableOpacity
              key={n}
              onPress={() => setDays(n)}
              style={[styles.option, days === n && styles.optionActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: days === n }}
            >
              <Text
                style={days === n ? styles.optionTextActive : styles.optionText}
              >
                {n} {i18n.t("plan.daysShort")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.disabledGenerateBtn]}
          onPress={generatePlan}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.generateText}>
              {i18n.t("plan.generate")}
            </Text>
          )}
        </TouchableOpacity>

        {plan && (
          <View style={styles.planBox}>
            <Text style={styles.planTitle}>{i18n.t("plan.aiGenerated")}</Text>
            {plan.map((dayBlock, index) => ( // Iterate through the structured plan (array of {day, exercises})
              <View key={index} style={styles.dayBlock}>
                <Text style={styles.dayTitle}>{dayBlock.day}</Text>
                {dayBlock.exercises.map((exercise, exIndex) => (
                  <Text key={exIndex} style={styles.workoutText}>
                    {exercise.name}: {exercise.details}
                  </Text>
                ))}
              </View>
            ))}
            <TouchableOpacity
              style={styles.startBtn}
              accessibilityRole="button"
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
    backgroundColor: colors.background,
    flexGrow: 1, // Use flexGrow for ScrollView contentContainerStyle
    padding: spacing.lg,
  },
  dayBlock: {
    marginBottom: spacing.md,
  },
  dayTitle: {
    color: colors.success,
    fontWeight: "bold",
    marginBottom: spacing.xs,
    fontSize: 16, // Adjusted for better readability
  },
  disabledGenerateBtn: {
    opacity: 0.6,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: "center", // Center text/loader
  },
  generateText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
    textAlign: "center",
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  loadingIndicator: {
    marginTop: spacing.lg,
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
  option: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    // Removed marginBottom/marginRight here, relying on gap in optionsRow
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
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm, // Using gap for consistent spacing
  },
  planBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  planTitle: {
    ...typography.heading3, // Added style for the AI-generated plan title
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
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
    textAlign: "center",
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  workoutText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 4, // Added small margin for readability between exercises
  },
});

export default PlanBuilderScreen;