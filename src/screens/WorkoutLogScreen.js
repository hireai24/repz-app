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
        <>
          <FlatList
            data={filteredWorkout}
            keyExtractor={(_, index) => `log-${index}`}
            contentContainerStyle={styles.flatListContent}
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
                    <TouchableOpacity
                      onPress={() => togglePR(exIndex, setIndex)}
                    >
                      <Text
                        style={[styles.prButton, set.pr && styles.prActive]}
                      >
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
  // Keep your previous styles
  dateText: {
    color: colors.text,
    fontSize: 14,
  },
  //... (the rest remains unchanged)
});

export default React.memo(WorkoutLogScreen);
