import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { UserContext } from "../context/UserContext";
import { useTierAccess } from "../hooks/useTierAccess";
import useFadeIn from "../animations/fadeIn";
import { saveNewUserPlan } from "../services/userPlanService";
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
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const getAuthToken = async () => {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("Missing auth token");
    return token;
  };

  const generatePlan = async () => {
    if (!goal || !split || !days) {
      setError(i18n.t("plan.missing"));
      return;
    }

    setLoading(true);
    setError("");
    setPlan(null);

    const payload = {
      goal,
      availableDays: days,
      injuries: userProfile?.injuries || [],
      equipment: userProfile?.equipment || ["Dumbbell", "Barbell"],
      preferredSplit: split,
      experienceLevel: userProfile?.experience || "Intermediate",
    };

    const messages = [
      {
        role: "system",
        content: "You are a certified elite personal trainer AI.",
      },
      {
        role: "user",
        content: `Generate a 1-week ${goal} workout split for an ${payload.experienceLevel} with ${days} available days using a ${split} approach. Injuries: ${payload.injuries.join(", ") || "None"}. Equipment: ${payload.equipment.join(", ")}.`,
      },
    ];

    try {
      const token = await getAuthToken();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/openai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const text = data.result;
      const splitByDays = text.split(/Day \d+ -/).filter(Boolean);
      const structured = {};
      splitByDays.forEach((section, idx) => {
        structured[`Day ${idx + 1}`] = section
          .trim()
          .split("\n")
          .filter(Boolean);
      });

      setPlan(structured);

      await saveNewUserPlan({
        userId,
        name: `AI Plan - ${goal}`,
        type: "Workout",
        exercises: Object.entries(structured).map(([day, workout]) => ({
          day,
          workout,
        })),
        createdAt: new Date().toISOString(),
      });
    } catch {
      setError(i18n.t("plan.error") || "Plan generation failed.");
    }

    setLoading(false);
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
          <Text style={styles.generateText}>
            {loading ? i18n.t("plan.generating") : i18n.t("plan.generate")}
          </Text>
        </TouchableOpacity>

        {plan && (
          <View style={styles.planBox}>
            {Object.entries(plan).map(([day, workout]) => (
              <View key={day} style={styles.dayBlock}>
                <Text style={styles.dayTitle}>{day}</Text>
                <Text style={styles.workoutText}>{workout.join(", ")}</Text>
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

        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loadingIndicator}
          />
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  dayBlock: {
    marginBottom: spacing.md,
  },
  dayTitle: {
    color: colors.success,
    fontWeight: "bold",
    marginBottom: spacing.xs,
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
    marginBottom: spacing.sm,
    marginRight: spacing.sm,
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
    gap: spacing.sm,
  },
  planBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  startBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    marginTop: spacing.md,
    padding: spacing.md,
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
  },
});

export default PlanBuilderScreen;
