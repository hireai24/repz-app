// src/screens/ChallengeSetupScreen.js
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { UserContext } from "../context/UserContext";
import { XPContext } from "../context/XPContext";
import { createChallenge } from "../api/challengeWagerApi";
import ChallengeTypeSelector from "../components/ChallengeTypeSelector"; // Correct import

import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const ChallengeSetupScreen = () => {
  const navigation = useNavigation();
  const { userProfile } = useContext(UserContext);
  const { xp } = useContext(XPContext);

  const [exercise, setExercise] = useState("");
  const [wagerXP, setWagerXP] = useState("50");
  const [opponents, setOpponents] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("reps"); // Initial state for challenge type
  const [winnerTakesAll, setWinnerTakesAll] = useState(false);
  const [representGym, setRepresentGym] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = () => {
    const parsedWagerXP = parseInt(wagerXP, 10);
    return (
      exercise.trim() !== "" &&
      !isNaN(parsedWagerXP) &&
      parsedWagerXP >= 50 &&
      parsedWagerXP <= 500 &&
      opponents.trim() !== "" &&
      type !== "" && // Ensure a type is selected
      !submitting
    );
  };

  const handleCreateChallenge = async () => {
    const wager = parseInt(wagerXP, 10);

    if (!canSubmit()) {
      Alert.alert(
        i18n.t("challengeSetup.invalidInputTitle") || "Invalid Input",
        i18n.t("challengeSetup.invalidInputMessage") || "Please fill in all fields properly and ensure XP wager is between 50-500."
      );
      return;
    }

    if (wager > xp) {
      Alert.alert(
        i18n.t("challengeSetup.notEnoughXpTitle") || "Not enough XP",
        i18n.t("challengeSetup.notEnoughXpMessage") || "You don’t have enough XP to wager."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await createChallenge({
        createdBy: userProfile?.uid, // Use userProfile.uid for consistency with Firebase Auth
        exercise,
        wagerXP: wager, // Send as number
        type,
        opponents: opponents.split(",").map((s) => s.trim()).filter(Boolean), // Filter out empty strings
        rules: description,
        winnerTakesAll,
        gym: representGym ? userProfile?.gymName : null, // Pass gymName if representing gym
      });

      if (res.success) {
        Alert.alert(
          i18n.t("challengeSetup.successTitle") || "✅ Challenge Created",
          i18n.t("challengeSetup.successMessage") || "Waiting for opponent(s) to accept."
        );
        navigation.goBack();
      } else {
        Alert.alert(
          i18n.t("common.error") || "Error",
          (res.error && res.error.message) || i18n.t("challengeSetup.createErrorMessage") || "Could not create challenge."
        );
      }
    } catch (err) {
      console.error("Error creating challenge:", err); // Log for debugging
      Alert.alert(i18n.t("common.error") || "Error", i18n.t("common.somethingWentWrong") || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        {i18n.t("challengeSetup.title") || "Create Workout Battle"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={i18n.t("challengeSetup.exercisePlaceholder") || "Exercise (e.g., Bench Press)"}
        placeholderTextColor={colors.textSecondary}
        value={exercise}
        onChangeText={setExercise}
      />

      <TextInput
        style={styles.input}
        placeholder={i18n.t("challengeSetup.opponentsPlaceholder") || "Opponent IDs (comma separated)"}
        placeholderTextColor={colors.textSecondary}
        value={opponents}
        onChangeText={setOpponents}
        autoCapitalize="none" // User IDs are typically not capitalized
      />

      <TextInput
        style={styles.input}
        placeholder={i18n.t("challengeSetup.xpWagerPlaceholder") || "XP Wager (50–500)"}
        placeholderTextColor={colors.textSecondary}
        value={wagerXP}
        onChangeText={(text) => setWagerXP(text.replace(/[^0-9]/g, ""))} // Only allow numeric input
        keyboardType="numeric"
      />

      {/* Corrected prop name: onChange -> onSelect */}
      <ChallengeTypeSelector selectedType={type} onSelect={setType} />

      <TextInput
        style={styles.textArea}
        placeholder={i18n.t("challengeSetup.descriptionPlaceholder") || "Challenge Description or Rules"}
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🎯 {i18n.t("challengeSetup.winnerTakesAll") || "Winner Takes All"}</Text>
        <Switch
          value={winnerTakesAll}
          onValueChange={setWinnerTakesAll}
          trackColor={{ false: colors.gray, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🏋️ {i18n.t("challengeSetup.representGym") || "Represent Your Gym"}</Text>
        <Switch
          value={representGym}
          onValueChange={setRepresentGym}
          trackColor={{ false: colors.gray, true: colors.accentBlue }}
          thumbColor={colors.white}
          disabled={!userProfile?.gymName} // Disable if user has no gym
        />
      </View>
      {!userProfile?.gymName && representGym && (
        <Text style={styles.disabledToggleHint}>
          {i18n.t("challengeSetup.noGymHint") || "You need to be part of a gym to represent one."}
        </Text>
      )}


      <TouchableOpacity
        style={[styles.submitBtn, !canSubmit() && styles.disabledBtn]}
        onPress={handleCreateChallenge}
        disabled={!canSubmit()}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>
            {i18n.t("challengeSetup.submit") || "Create Challenge"}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// No prop-types needed as it's a screen component, not meant for reuse with props from parent
// ChallengeSetupScreen.propTypes = {}; // Can remove this if it's purely a screen

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  disabledBtn: {
    backgroundColor: colors.disabled,
    opacity: 0.7,
  },
  disabledToggleHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.md,
    textAlign: "right",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  submitBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md, // Add some top margin
  },
  submitText: {
    color: colors.white,
    fontWeight: "bold",
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    height: 120,
    marginBottom: spacing.md,
    padding: spacing.md,
    textAlignVertical: "top",
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
});

export default ChallengeSetupScreen;