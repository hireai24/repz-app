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
import ChallengeTypeSelector from "../components/ChallengeTypeSelector";

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
  const [type, setType] = useState("reps");
  const [winnerTakesAll, setWinnerTakesAll] = useState(false);
  const [representGym, setRepresentGym] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = () =>
    exercise.trim() &&
    parseInt(wagerXP, 10) >= 50 &&
    parseInt(wagerXP, 10) <= 500 &&
    opponents.trim() &&
    type &&
    !submitting;

  const handleCreateChallenge = async () => {
    const wager = parseInt(wagerXP, 10);

    if (!canSubmit()) {
      Alert.alert("Invalid", "Please fill in all fields properly.");
      return;
    }

    if (wager > xp) {
      Alert.alert("Not enough XP", "You don’t have enough XP to wager.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await createChallenge({
        createdBy: userProfile?.id,
        exercise,
        xpPot: wager,
        type,
        opponents: opponents.split(",").map((s) => s.trim()),
        rules: description,
        winnerTakesAll,
        gymName: representGym ? userProfile?.gymName : null,
      });

      if (res.success) {
        Alert.alert(
          "✅ Challenge Created",
          "Waiting for opponent(s) to accept.",
        );
        navigation.goBack();
      } else {
        Alert.alert(
          "Error",
          (res.error && res.error.message) || "Could not create challenge.",
        );
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
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
        placeholder="Exercise (e.g., Bench Press)"
        value={exercise}
        onChangeText={setExercise}
      />

      <TextInput
        style={styles.input}
        placeholder="Opponent IDs (comma separated)"
        value={opponents}
        onChangeText={setOpponents}
      />

      <TextInput
        style={styles.input}
        placeholder="XP Wager (50–500)"
        value={wagerXP}
        onChangeText={setWagerXP}
        keyboardType="numeric"
      />

      <ChallengeTypeSelector selectedType={type} onChange={setType} />

      <TextInput
        style={styles.textArea}
        placeholder="Challenge Description or Rules"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🎯 Winner Takes All</Text>
        <Switch
          value={winnerTakesAll}
          onValueChange={setWinnerTakesAll}
          trackColor={{ false: colors.gray, true: colors.primary }}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🏋️ Represent Your Gym</Text>
        <Switch
          value={representGym}
          onValueChange={setRepresentGym}
          trackColor={{ false: colors.gray, true: colors.accentBlue }}
        />
      </View>

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

// Add prop-types for future-proofing and warnings removal if this becomes a child component
ChallengeSetupScreen.propTypes = {};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  disabledBtn: {
    backgroundColor: colors.disabled,
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
