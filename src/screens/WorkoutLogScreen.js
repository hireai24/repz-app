// src/screens/WorkoutLogScreen.js

import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  Dimensions,
  Image,
  TextInput,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";
import LottieView from "lottie-react-native";
import Toast from "react-native-toast-message";

import ExerciseCard from "../components/ExerciseCard";
import WorkoutSummaryCard from "../components/WorkoutSummaryCard";
import { filterExercises, searchExercises } from "../utils/exerciseFilter";
import { getUserPlans } from "../api/marketplaceApi";
import useFadeIn from "../animations/fadeIn";
import useTierAccess from "../hooks/useTierAccess";
import { UserContext } from "../context/UserContext";
import exerciseData from "../assets/exerciseDatabase.json";
import i18n from "../locales/i18n";
import spacing from "../theme/spacing";
import colors from "../theme/colors";
import typography from "../theme/typography";

const { width } = Dimensions.get("window");

const WorkoutLogScreen = () => {
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [workout, setWorkout] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [errorLoadingPlans, setErrorLoadingPlans] = useState("");
  const [showXP, setShowXP] = useState(false);

  const fadeAnim = useFadeIn(150);
  const { allowed } = useTierAccess("Free");
  const { userId } = useContext(UserContext);
  const xpAnim = useRef();

  const loadPlans = useCallback(async () => {
    try {
      setLoadingPlans(true);
      setErrorLoadingPlans("");
      const token = await AsyncStorage.getItem("authToken");
      if (!token) throw new Error("Missing auth token");
      if (!userId) throw new Error("Missing user ID");

      const response = await getUserPlans(userId, token);
      if (response.success) {
        setUserPlans(response.plans || []);
      } else {
        setErrorLoadingPlans(response.error || i18n.t("errors.loadPlans"));
      }
    } catch {
      setErrorLoadingPlans(i18n.t("errors.loadPlans"));
    } finally {
      setLoadingPlans(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadPlans();
  }, [userId, loadPlans]);

  const addExercise = (exercise) => {
    setWorkout((prev) => [
      ...prev,
      {
        ...exercise,
        sets: [{ weight: "", reps: "", rpe: "", pr: false }],
        challengeEntry: false,
        video: null,
        date: format(date, "yyyy-MM-dd"),
      },
    ]);
  };

  const loadPlanToLog = (plan) => {
    const formatted = (plan.exercises || []).map((ex) => ({
      ...ex,
      sets: [{ weight: "", reps: "", rpe: "", pr: false }],
      challengeEntry: false,
      video: null,
      date: format(date, "yyyy-MM-dd"),
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
    ex.date?.includes(format(date, "yyyy-MM-dd"))
  );

  const handleSaveWorkout = () => {
    setShowXP(true);
    if (xpAnim.current) {
      xpAnim.current.play();
    }
    setTimeout(() => setShowXP(false), 1200);
    Toast.show({
      type: "success",
      text1: i18n.t("workoutLog.savedTitle"),
      text2: i18n.t("workoutLog.savedMessage"),
      position: "bottom",
    });
  };

  const handleDateChange = (_, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

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
        ) : userPlans.length > 0 ? (
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
        ) : (
          <Text style={styles.emptyText}>{i18n.t("dashboard.noPlans")}</Text>
        )}

        <TouchableOpacity
          style={styles.inputRow}
          onPress={() => setShowDatePicker(true)}
        >
          <Image
            source={require("../assets/icons/calendar.png")}
            style={styles.icon}
          />
          <Text style={styles.dateText}>
            {format(date, "yyyy-MM-dd")}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <FlatList
          data={filtered}
          horizontal
          keyExtractor={(item) => item.id}
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
        <>
          <FlatList
            data={filteredWorkout}
            keyExtractor={(_, index) => `log-${index}`}
            contentContainerStyle={styles.flatListContent}
            renderItem={({ item, index }) => (
              <View key={index} style={styles.exerciseBlock}>
                <Text style={styles.exerciseTitle}>{item.name}</Text>
                {item.sets.map((set, setIndex) => (
                  <View key={setIndex} style={styles.setRow}>
                    {/* Input fields */}
                  </View>
                ))}
                {/* Add set / Challenge */}
              </View>
            )}
          />

          <WorkoutSummaryCard
            workout={filteredWorkout}
            date={format(date, "MMMM dd, yyyy")}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveWorkout}>
            <Image
              source={require("../assets/icons/icon-plus.png")}
              style={styles.plusIcon}
            />
            <Text style={styles.saveText}>{i18n.t("workoutLog.saveLog")}</Text>
          </TouchableOpacity>
        </>
      )}

      {showXP && (
        <LottieView
          ref={xpAnim}
          source={require("../assets/xp/xp-burst.json")}
          autoPlay
          loop={false}
          style={styles.xpAnimation}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { ...typography.heading2, color: colors.textPrimary, marginBottom: spacing.sm },
  dateText: { color: colors.textPrimary, fontSize: 14 },
  inputRow: { flexDirection: "row", alignItems: "center", marginVertical: spacing.sm },
  icon: { width: 20, height: 20, tintColor: colors.textSecondary, marginRight: spacing.xs },
  planSelector: { marginVertical: spacing.sm },
  planChip: { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: 8, marginRight: spacing.sm },
  planText: { color: colors.textPrimary },
  emptyText: { textAlign: "center", color: colors.textSecondary },
  loadingText: { textAlign: "center", color: colors.textSecondary },
  errorText: { textAlign: "center", color: colors.error },
  flatListContent: { paddingBottom: spacing.lg },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  saveBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, borderRadius: 8, padding: spacing.md, marginTop: spacing.md, alignSelf: "center" },
  plusIcon: { width: 18, height: 18, tintColor: colors.textOnPrimary, marginRight: spacing.xs },
  saveText: { color: colors.textOnPrimary, fontWeight: "bold" },
  xpAnimation: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});

export default React.memo(WorkoutLogScreen);
