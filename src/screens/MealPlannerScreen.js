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
import { useTierAccess } from "../hooks/useTierAccess";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const MealPlannerScreen = () => {
  const { authUser } = useContext(AuthContext); // Only using authUser
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
      Alert.alert(
        "Upgrade Required",
        "You need a Pro or Elite tier subscription to access the meal planner.",
      );
      return;
    }

    if (!authUser?.uid) {
      Alert.alert("Error", "User not logged in or authentication failed.");
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
        "Invalid Input",
        "Please enter valid positive numbers for Protein, Carbs, and Fats.",
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
        Alert.alert("Success", "Meal plan generated!");
      } else {
        const errorMessage =
          response?.error?.message ||
          "Failed to generate meal plan. Please check your inputs.";
        throw new Error(errorMessage);
      }
    } catch (err) {
      Alert.alert("Generation Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMealPlan = () => {
    if (!mealPlan || mealPlan.length === 0) return null;

    return (
      <View style={styles.planContainer}>
        <Text style={styles.sectionHeader}>Your Personalized Meal Plan</Text>
        {mealPlan.map((meal, index) => (
          <MealPlanCard key={index} meal={meal} index={index} />
        ))}
      </View>
    );
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>
          Upgrade to Pro or Elite to access the AI Meal Planner.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Alert.alert(
              "Go to Marketplace",
              "Navigate to subscription marketplace.",
            )
          }
        >
          <Text style={styles.buttonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>AI Meal Plan Generator</Text>

      <Text style={styles.label}>Goal</Text>
      <Picker
        selectedValue={goal}
        onValueChange={setGoal}
        style={styles.picker}
        itemStyle={styles.pickerItem}
      >
        <Picker.Item label="Fat Loss" value="fatLoss" />
        <Picker.Item label="Muscle Gain" value="muscleGain" />
        <Picker.Item label="Maintenance" value="maintenance" />
      </Picker>

      <Text style={styles.label}>Diet Type</Text>
      <Picker
        selectedValue={dietType}
        onValueChange={setDietType}
        style={styles.picker}
        itemStyle={styles.pickerItem}
      >
        <Picker.Item label="Balanced" value="balanced" />
        <Picker.Item label="High Protein" value="highProtein" />
        <Picker.Item label="Low Carb" value="lowCarb" />
        <Picker.Item label="Vegan" value="vegan" />
        <Picker.Item label="Carnivore" value="carnivore" />
      </Picker>

      <Text style={styles.label}>Protein (g)</Text>
      <TextInput
        keyboardType="numeric"
        value={protein}
        onChangeText={setProtein}
        placeholder="e.g., 150"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />

      <Text style={styles.label}>Carbs (g)</Text>
      <TextInput
        keyboardType="numeric"
        value={carbs}
        onChangeText={setCarbs}
        placeholder="e.g., 200"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />

      <Text style={styles.label}>Fats (g)</Text>
      <TextInput
        keyboardType="numeric"
        value={fats}
        onChangeText={setFats}
        placeholder="e.g., 70"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Generate Meal Plan</Text>
        )}
      </TouchableOpacity>

      {renderMealPlan()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 6,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  buttonText: {
    color: colors.white,
    ...typography.buttonText,
  },
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.textPrimary,
    padding: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.md,
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
    marginBottom: spacing.md,
    textAlign: "center",
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
  },
  pickerItem: {
    color: colors.textPrimary,
  },
  planContainer: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
});

export default MealPlannerScreen;
