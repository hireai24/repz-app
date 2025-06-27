// src/screens/MealPlannerScreen.js
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { AuthContext } from "../context/AuthContext";
import { generateMealPlan as callGenerateMealPlanAPI } from "../api/mealApi";
import MealPlanCard from "../components/MealPlanCard";
import useTierAccess from "../hooks/useTierAccess";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const MealPlannerScreen = () => {
  const { authUser } = useContext(AuthContext);
  const { locked } = useTierAccess("Pro");

  const [goal, setGoal] = useState("fatLoss");
  const [dietType, setDietType] = useState("balanced");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);

  const handleGenerate = async () => {
    if (locked) {
      Alert.alert(i18n.t("mealPlanner.upgradeTitle"), i18n.t("mealPlanner.upgradeMessage"));
      return;
    }
    if (!authUser?.uid) {
      Alert.alert(i18n.t("common.error"), i18n.t("mealPlanner.authError"));
      return;
    }

    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFats = Number(fats);

    if (
      isNaN(parsedProtein) ||
      parsedProtein <= 0 ||
      isNaN(parsedCarbs) ||
      parsedCarbs <= 0 ||
      isNaN(parsedFats) ||
      parsedFats <= 0
    ) {
      Alert.alert(
        i18n.t("mealPlanner.invalidInputTitle"),
        i18n.t("mealPlanner.invalidInputMessage")
      );
      return;
    }

    setLoading(true);
    setMealPlan(null);

    try {
      const payload = {
        userId: authUser.uid,
        goal,
        dietaryPreferences: dietType,
        dailyCalories: parsedProtein * 4 + parsedCarbs * 4 + parsedFats * 9,
        protein: parsedProtein,
        carbs: parsedCarbs,
        fat: parsedFats,
        mealsPerDay: 4,
      };

      const response = await callGenerateMealPlanAPI(payload);

      if (response?.success && response.plan) {
        setMealPlan(response.plan);
        Alert.alert(i18n.t("mealPlanner.successTitle"), i18n.t("mealPlanner.successMessage"));
      } else {
        throw new Error(response?.error?.message || i18n.t("mealPlanner.failureMessage"));
      }
    } catch (err) {
      Alert.alert(i18n.t("mealPlanner.failureTitle"), err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMealPlan = () => {
    if (!mealPlan || mealPlan.length === 0) return null;

    return (
      <View style={styles.planContainer}>
        <Text style={styles.sectionHeader}>{i18n.t("mealPlanner.yourPlan")}</Text>
        {mealPlan.map((meal, index) => (
          <MealPlanCard key={index} meal={meal} index={index} />
        ))}
      </View>
    );
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t("mealPlanner.upgradeMessage")}</Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => Alert.alert(i18n.t("mealPlanner.upgradeAction"))}
          accessibilityRole="button"
        >
          <Text style={styles.upgradeButtonText}>{i18n.t("mealPlanner.upgradeButton")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{i18n.t("mealPlanner.title")}</Text>

      <Text style={styles.label}>{i18n.t("mealPlanner.goal")}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={goal}
          onValueChange={setGoal}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label={i18n.t("mealPlanner.fatLoss")} value="fatLoss" />
          <Picker.Item label={i18n.t("mealPlanner.muscleGain")} value="muscleGain" />
          <Picker.Item label={i18n.t("mealPlanner.maintenance")} value="maintenance" />
        </Picker>
      </View>

      <Text style={styles.label}>{i18n.t("mealPlanner.dietType")}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={dietType}
          onValueChange={setDietType}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label={i18n.t("mealPlanner.balanced")} value="balanced" />
          <Picker.Item label={i18n.t("mealPlanner.highProtein")} value="highProtein" />
          <Picker.Item label={i18n.t("mealPlanner.lowCarb")} value="lowCarb" />
          <Picker.Item label={i18n.t("mealPlanner.vegan")} value="vegan" />
          <Picker.Item label={i18n.t("mealPlanner.carnivore")} value="carnivore" />
        </Picker>
      </View>

      {["protein", "carbs", "fats"].map((macro) => (
        <View key={macro}>
          <Text style={styles.label}>{i18n.t(`mealPlanner.${macro}`)}</Text>
          <TextInput
            keyboardType="numeric"
            value={macro === "protein" ? protein : macro === "carbs" ? carbs : fats}
            onChangeText={
              macro === "protein"
                ? setProtein
                : macro === "carbs"
                ? setCarbs
                : setFats
            }
            placeholder={i18n.t(`mealPlanner.${macro}Placeholder`)}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.generateButton, loading && styles.buttonDisabled]}
        onPress={handleGenerate}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.generateButtonText}>{i18n.t("mealPlanner.generate")}</Text>
        )}
      </TouchableOpacity>

      {renderMealPlan()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  picker: {
    width: "100%",
  },
  pickerItem: {
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  generateButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  generateButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  upgradeButtonText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  planContainer: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
});

export default MealPlannerScreen;
