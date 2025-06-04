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
import { UserContext } from "../context/UserContext";
import { AuthContext } from "../context/AuthContext";
import { generateMealPlan as callGenerateMealPlanAPI } from "../api/mealApi";
import MealPlanCard from "../components/MealPlanCard";
import { useTierAccess } from "../hooks/useTierAccess";

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const MealPlannerScreen = () => {
  const { user } = useContext(UserContext); // user from UserContext (for profile data like ID)
  const { authUser } = useContext(AuthContext); // authUser from AuthContext (for Firebase UID, token, and tier check)
  const { locked } = useTierAccess("Pro"); // Meal planner is a Pro feature

  const [goal, setGoal] = useState("fatLoss");
  const [dietType, setDietType] = useState("balanced");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null); // Will store the parsed JSON array of meals

  const handleGenerate = async () => {
    if (locked) { // Frontend tier check
      Alert.alert("Upgrade Required", "You need a Pro or Elite tier subscription to access the meal planner.");
      return;
    }

    if (!authUser?.uid) { // Use authUser.uid for the actual authenticated user ID
      Alert.alert("Error", "User not logged in or authentication failed.");
      return;
    }

    // Basic input validation for macros
    const parsedProtein = Number(protein);
    const parsedCarbs = Number(carbs);
    const parsedFats = Number(fats);

    if (isNaN(parsedProtein) || parsedProtein <= 0 ||
        isNaN(parsedCarbs) || parsedCarbs <= 0 ||
        isNaN(parsedFats) || parsedFats <= 0) {
        Alert.alert("Invalid Input", "Please enter valid positive numbers for Protein, Carbs, and Fats.");
        return;
    }

    setLoading(true);
    setMealPlan(null); // Clear previous plan

    try {
      const payload = {
        userId: authUser.uid, // Use authUser.uid as the definitive user ID for backend
        goal, // Pass the selected goal
        dietaryPreferences: dietType,
        dailyCalories: (parsedProtein * 4) + (parsedCarbs * 4) + (parsedFats * 9), // Calculate total calories
        protein: parsedProtein,
        carbs: parsedCarbs,
        fat: parsedFats, // Backend expects 'fat', not 'fats'
        mealsPerDay: 4, // Assuming default 4 meals per day for now, can make configurable
      };

      // Call backend API for meal plan generation
      const response = await callGenerateMealPlanAPI(payload); // Removed authUser from here
      console.log("Meal Plan API Response:", response);

      if (response?.success && response.plan) { // Backend now returns 'plan' as structured array
        // Assuming response.plan is already an array of meal objects
        setMealPlan(response.plan);
        Alert.alert("Success", "Meal plan generated!");
      } else {
        const errorMessage = response?.error?.message || "Failed to generate meal plan. Please check your inputs.";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("Meal generation error:", err);
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
          // MealPlanCard expects 'meal' directly, not a 'day' object
          <MealPlanCard key={index} meal={meal} index={index} />
        ))}
      </View>
    );
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>Upgrade to Pro or Elite to access the AI Meal Planner.</Text>
        <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Go to Marketplace", "Navigate to subscription marketplace.")}>
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

      <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={loading}>
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
  dayBlock: { // This style might become redundant if not structuring by day
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  dayTitle: { // This style might become redundant if not structuring by day
    ...typography.h4,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  header: {
    ...typography.h2,
    marginBottom: spacing.md,
    textAlign: "center",
    color: colors.textPrimary,
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
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
  },
  pickerItem: { // Added for explicit styling of picker items
    color: colors.textPrimary,
  },
  planContainer: {
    marginTop: spacing.xl,
  },
  sectionHeader: { // New style for the meal plan section
    ...typography.h3,
    marginBottom: spacing.md,
    color: colors.textPrimary,
    textAlign: 'center',
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
    marginBottom: spacing.md,
  },
});

export default MealPlannerScreen;