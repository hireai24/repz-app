// src/screens/OnboardingScreen.js

import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Alert,
  Image,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseClient";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import AvatarSelector from "../components/AvatarSelector";
import useFadeIn from "../animations/fadeIn";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import i18n from "../locales/i18n";
import defaultAvatar from "../assets/avatars/avatar1.png";
import logoImage from "../assets/logo.png";

const goals = ["Fat Loss", "Muscle Gain", "Strength", "Athletic"];

const OnboardingScreen = () => {
  const { signIn } = useContext(AuthContext);
  const { setUserProfile } = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [gym, setGym] = useState("");
  const [goal, setGoal] = useState(null);
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const logoFade = useFadeIn(150);
  const formFade = useFadeIn(300);

  const validateInputs = () => {
    const newErrors = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = i18n.t("onboarding.invalidEmail");
    }
    if (!password || password.length < 6) {
      newErrors.password = i18n.t("onboarding.invalidPassword");
    }
    if (!username) newErrors.username = i18n.t("onboarding.required");
    if (!goal) newErrors.goal = i18n.t("onboarding.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCred.user.uid;

      const userData = {
        id: userId,
        email,
        username,
        gym,
        goal,
        tier: "Free",
        avatar,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", userId), userData);
      setUserProfile(userData);
      signIn();

      Alert.alert(i18n.t("onboarding.successTitle"), i18n.t("onboarding.successMessage"));
    } catch (err) {
      setErrors({ general: err.message || i18n.t("common.error") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo */}
        <Animated.View style={{ opacity: logoFade }}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.formWrapper, { opacity: formFade }]}>
          <Text style={styles.title}>{i18n.t("onboarding.welcome")}</Text>

          {errors.general && (
            <Text style={styles.errorText}>{errors.general}</Text>
          )}

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password */}
          <Text style={styles.label}>{i18n.t("onboarding.password")}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Username */}
          <Text style={styles.label}>{i18n.t("onboarding.username")}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="e.g. BeastMode94"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          {/* Gym */}
          <Text style={styles.label}>{i18n.t("onboarding.gym")}</Text>
          <TextInput
            style={styles.input}
            value={gym}
            onChangeText={setGym}
            placeholder="e.g. PureGym London"
            placeholderTextColor={colors.textSecondary}
          />

          {/* Goal */}
          <Text style={styles.label}>{i18n.t("onboarding.goalPrompt")}</Text>
          <View style={styles.optionRow}>
            {goals.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.option, goal === g && styles.optionActive]}
                onPress={() => setGoal(g)}
                accessibilityRole="radio"
                accessibilityState={{ selected: goal === g }}
              >
                <Text
                  style={[
                    styles.optionText,
                    goal === g && styles.optionTextActive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.goal && <Text style={styles.errorText}>{errors.goal}</Text>}

          {/* Avatar */}
          <Text style={styles.label}>{i18n.t("onboarding.selectAvatar")}</Text>
          <AvatarSelector selectedAvatar={avatar} onSelect={setAvatar} />

          {/* Continue */}
          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaLoading]}
            onPress={handleContinue}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.ctaText}>{i18n.t("onboarding.start")}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  logo: {
    aspectRatio: 1,
    width: "50%",
    marginBottom: spacing.md,
  },
  formWrapper: {
    width: "100%",
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  label: {
    alignSelf: "flex-start",
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    color: colors.textPrimary,
    marginTop: 6,
    padding: spacing.md,
    width: "100%",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  option: {
    backgroundColor: colors.surface,
    borderRadius: 8,
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
  cta: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.xl,
    padding: spacing.lg,
    width: "100%",
  },
  ctaLoading: {
    opacity: 0.7,
  },
  ctaText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    alignSelf: "flex-start",
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
});

export default OnboardingScreen;
