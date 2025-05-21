import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";

import ExerciseCard from "../components/ExerciseCard";
import { filterExercises, searchExercises } from "../utils/exerciseFilter";
import { getUserPlans } from "../api/marketplaceApi";
import useFadeIn from "../animations/fadeIn";
import { useTierAccess } from "../hooks/useTierAccess";
import { UserContext } from "../context/UserContext";
import exerciseData from "../assets/exerciseDatabase.json";
import i18n from "../locales/i18n";
import spacing from "../theme/spacing";
import colors from "../theme/colors";
import typography from "../theme/typography";

const { width } = Dimensions.get("window");

const WorkoutLogScreen = () => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [workout, setWorkout] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [errorLoadingPlans, setErrorLoadingPlans] = useState("");
  const fadeAnim = useFadeIn(150);
  const { allowed } = useTierAccess("Free");
  const { userId } = useContext(UserContext);

  useEffect(() => {
    if (userId) loadPlans();
  }, [userId]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      setErrorLoadingPlans("");
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Missing auth token");
      const response = await getUserPlans(userId, token);
      if (response.success) {
        setUserPlans(response.plans || []);
      } else {
        setErrorLoadingPlans(response.error || i18n.t("errors.loadPlans"));
      }
    } catch (err) {
      console.error("Failed to load user plans:", err);
      setErrorLoadingPlans(i18n.t("errors.loadPlans"));
    } finally {
      setLoadingPlans(false);
    }
  };

  const addExercise = (exercise) => {
    setWorkout((prev) => [
      ...prev,
      {
        ...exercise,
        sets: [{ weight: "", reps: "", rpe: "", pr: false }],
        challengeEntry: false,
        video: null,
        date: format(new Date(), "yyyy-MM-dd"),
      },
    ]);
    Alert.alert(i18n.t("workout.addExercise"), `${exercise.name}`);
  };

  const loadPlanToLog = (plan) => {
    const formatted = (plan.exercises || []).map((ex) => ({
      ...ex,
      sets: [{ weight: "", reps: "", rpe: "", pr: false }],
      challengeEntry: false,
      video: null,
      date: format(new Date(), "yyyy-MM-dd"),
    }));
    setWorkout(formatted);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...workout];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setWorkout(updated);
  };

  const addSet = (exerciseIndex) => {
    const updated = [...workout];
    updated[exerciseIndex].sets.push({
      weight: "",
      reps: "",
      rpe: "",
      pr: false,
    });
    setWorkout(updated);
  };

  const togglePR = (exerciseIndex, setIndex) => {
    const updated = [...workout];
    updated[exerciseIndex].sets[setIndex].pr =
      !updated[exerciseIndex].sets[setIndex].pr;
    setWorkout(updated);
  };

  const toggleChallenge = (exerciseIndex) => {
    const updated = [...workout];
    updated[exerciseIndex].challengeEntry =
      !updated[exerciseIndex].challengeEntry;
    setWorkout(updated);
  };

  const filtered = searchExercises(filterExercises(exerciseData, {}), search);
  const filteredWorkout = workout.filter((ex) =>
    dateFilter ? ex.date?.includes(dateFilter.trim()) : true
  );

  if (!allowed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.locked}>{i18n.t("workout.tierLock")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>
          {i18n.t("workoutLog.title") || i18n.t("dashboard.todayWorkout")}
        </Text>

        {loadingPlans ? (
          <Text style={styles.loadingText}>{i18n.t("common.loading")}</Text>
        ) : errorLoadingPlans ? (
          <Text style={styles.errorText}>{errorLoadingPlans}</Text>
        ) : (
          userPlans.length > 0 && (
            <View style={styles.planSelector}>
              <Text style={styles.sectionTitle}>
                {i18n.t("workoutLog.loadPlan")}
              </Text>
              <FlatList
                data={userPlans}
                horizontal
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.planChip}
                    onPress={() => loadPlanToLog(item)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.planText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.sm }}
              />
            </View>
          )
        )}

        <TextInput
          style={styles.input}
          placeholder={i18n.t("workoutLog.addExercise")}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />

        <TextInput
          style={styles.input}
          placeholder="Filter by date (yyyy-mm-dd)"
          placeholderTextColor={colors.textSecondary}
          value={dateFilter}
          onChangeText={setDateFilter}
        />

        <FlatList
          data={filtered}
          horizontal
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          renderItem={({ item }) => (
            <ExerciseCard exercise={item} onAdd={() => addExercise(item)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: spacing.md }}
        />
      </Animated.View>

      {filteredWorkout.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t("common.noData")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkout}
          keyExtractor={(_, index) => `log-${index}`}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item, index: exIndex }) => (
            <View key={exIndex} style={styles.exerciseBlock}>
              <Text style={styles.exerciseTitle}>{item.name}</Text>
              {item.sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <TextInput
                    style={[styles.setInput, { width: width * 0.2 }]}
                    placeholder={i18n.t("workoutLog.weight")}
                    keyboardType="numeric"
                    value={set.weight}
                    onChangeText={(val) =>
                      updateSet(exIndex, setIndex, "weight", val)
                    }
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.setInput, { width: width * 0.2 }]}
                    placeholder={i18n.t("workoutLog.reps")}
                    keyboardType="numeric"
                    value={set.reps}
                    onChangeText={(val) =>
                      updateSet(exIndex, setIndex, "reps", val)
                    }
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.setInput, { width: width * 0.2 }]}
                    placeholder={i18n.t("workoutLog.rpe")}
                    keyboardType="numeric"
                    value={set.rpe}
                    onChangeText={(val) =>
                      updateSet(exIndex, setIndex, "rpe", val)
                    }
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity onPress={() => togglePR(exIndex, setIndex)}>
                    <Text style={[styles.prButton, set.pr && styles.prActive]}>
                      PR
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => addSet(exIndex)}
              >
                <Text style={styles.addSetText}>
                  + {i18n.t("workoutLog.addSet")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.challengeToggle}
                onPress={() => toggleChallenge(exIndex)}
              >
                <Text
                  style={{
                    color: item.challengeEntry
                      ? colors.success
                      : colors.textSecondary,
                  }}
                >
                  {item.challengeEntry
                    ? i18n.t("workoutLog.markedChallenge")
                    : i18n.t("workoutLog.tagChallenge")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md, backgroundColor: colors.background },
  title: { ...typography.h2, color: colors.primary, marginBottom: spacing.md },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    color: colors.text,
  },
  locked: { color: colors.textSecondary, textAlign: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: colors.textSecondary },
  planSelector: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.sm },
  planChip: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  planText: { color: colors.text },
  exerciseBlock: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  exerciseTitle: { ...typography.h4, marginBottom: spacing.sm, color: colors.text },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    justifyContent: "space-between",
  },
  setInput: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    padding: spacing.sm,
    color: colors.text,
  },
  prButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.border,
    color: colors.text,
  },
  prActive: {
    backgroundColor: colors.accent,
    color: "#fff",
  },
  addSetBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  addSetText: {
    color: colors.primary,
    fontWeight: "bold",
  },
  challengeToggle: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
  },
  loadingText: { color: colors.textSecondary },
  errorText: { color: colors.error },
});

export default React.memo(WorkoutLogScreen);

