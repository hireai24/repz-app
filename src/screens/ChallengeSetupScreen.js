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

  const canSubmit = () => {
    const parsedWager = parseInt(wagerXP, 10);
    return (
      exercise.trim() &&
      !isNaN(parsedWager) &&
      parsedWager >= 50 &&
      parsedWager <= 500 &&
      opponents.trim() &&
      type &&
      !submitting
    );
  };

  const handleCreateChallenge = async () => {
    const wager = parseInt(wagerXP, 10);

    if (!canSubmit()) {
      Alert.alert(
        i18n.t("challengeSetup.invalidInputTitle"),
        i18n.t("challengeSetup.invalidInputMessage")
      );
      return;
    }

    if (wager > xp) {
      Alert.alert(
        i18n.t("challengeSetup.notEnoughXpTitle"),
        i18n.t("challengeSetup.notEnoughXpMessage")
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await createChallenge({
        createdBy: userProfile?.uid,
        exercise,
        wagerXP: wager,
        type,
        opponents: opponents
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        rules: description,
        winnerTakesAll,
        gym: representGym ? userProfile?.gymName : null,
      });

      if (res.success) {
        Alert.alert(
          i18n.t("challengeSetup.successTitle"),
          i18n.t("challengeSetup.successMessage")
        );
        navigation.goBack();
      } else {
        Alert.alert(
          i18n.t("common.error"),
          res.error || i18n.t("challengeSetup.createErrorMessage")
        );
      }
    } catch {
      Alert.alert(
        i18n.t("common.error"),
        i18n.t("common.somethingWentWrong")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{i18n.t("challengeSetup.title")}</Text>

      <TextInput
        style={styles.input}
        placeholder={i18n.t("challengeSetup.exercisePlaceholder")}
        placeholderTextColor={colors.textTertiary}
        value={exercise}
        onChangeText={setExercise}
      />

      <TextInput
        style={styles.input}
        placeholder={i18n.t("challengeSetup.opponentsPlaceholder")}
        placeholderTextColor={colors.textTertiary}
        value={opponents}
        onChangeText={setOpponents}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={i18n.t("challengeSetup.xpWagerPlaceholder")}
        placeholderTextColor={colors.textTertiary}
        value={wagerXP}
        onChangeText={(text) => setWagerXP(text.replace(/[^0-9]/g, ""))}
        keyboardType="numeric"
      />

      <ChallengeTypeSelector selectedType={type} onSelect={setType} />

      <TextInput
        style={styles.textArea}
        placeholder={i18n.t("challengeSetup.descriptionPlaceholder")}
        placeholderTextColor={colors.textTertiary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🎯 {i18n.t("challengeSetup.winnerTakesAll")}</Text>
        <Switch
          value={winnerTakesAll}
          onValueChange={setWinnerTakesAll}
          trackColor={{ false: colors.gray, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>🏋️ {i18n.t("challengeSetup.representGym")}</Text>
        <Switch
          value={representGym}
          onValueChange={setRepresentGym}
          trackColor={{ false: colors.gray, true: colors.accentBlue }}
          thumbColor={colors.white}
          disabled={!userProfile?.gymName}
        />
      </View>

      {!userProfile?.gymName && representGym && (
        <Text style={styles.disabledToggleHint}>
          {i18n.t("challengeSetup.noGymHint")}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, !canSubmit() && styles.disabledBtn]}
        onPress={handleCreateChallenge}
        disabled={!canSubmit()}
      >
        {submitting ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.submitText}>{i18n.t("challengeSetup.submit")}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flexGrow: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 100,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  disabledToggleHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "right",
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: spacing.borderRadius,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  submitText: {
    ...typography.bodyBold,
    color: colors.textOnPrimary,
  },
  disabledBtn: {
    backgroundColor: colors.disabled,
  },
});

export default ChallengeSetupScreen;
