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
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import { auth, db } from "../firebase/firebaseClient"; // ✅ FIXED PATH
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import AvatarSelector from "../components/AvatarSelector";
import useFadeIn from "../animations/fadeIn";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import i18n from "../locales/i18n";

const goals = ["Fat Loss", "Muscle Gain", "Strength", "Athletic"];

const OnboardingScreen = () => {
  const { signIn } = useContext(AuthContext);
  const { setUserProfile } = useContext(UserContext);

  const [username, setUsername] = useState("");
  const [gym, setGym] = useState("");
  const [goal, setGoal] = useState(null);
  const [avatar, setAvatar] = useState(
    require("../assets/avatars/avatar1.png")
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const logoFade = useFadeIn(150);
  const formFade = useFadeIn(300);

  const validateInputs = () => {
    const newErrors = {};
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email =
        i18n.t("onboarding.invalidEmail") || "Invalid email address";
    }
    if (!password || password.length < 6) {
      newErrors.password =
        i18n.t("onboarding.invalidPassword") ||
        "Password must be at least 6 characters";
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

      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCred.user.uid;

      const tier = "Free";
      const userData = {
        id: userId,
        email,
        username,
        gym,
        goal,
        tier,
        avatar,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", userId), userData);
      setUserProfile(userData);
      signIn();

      Alert.alert(
        i18n.t("onboarding.successTitle") || "Welcome!",
        i18n.t("onboarding.successMessage") || "Your account has been created."
      );
    } catch (err) {
      console.error("Sign up error:", err);
      setErrors({ general: err.message || i18n.t("common.error") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.Image
          source={require("../assets/logo.png")}
          style={[styles.logo, { opacity: logoFade }]}
          resizeMode="contain"
        />

        <Animated.View style={{ opacity: formFade, width: "100%" }}>
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
            accessibilityLabel="email"
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
            accessibilityLabel="password"
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
            accessibilityLabel="username"
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
            accessibilityLabel="gym"
          />

          {/* Goal selection */}
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

          {/* Avatar selector */}
          <Text style={styles.label}>{i18n.t("onboarding.selectAvatar")}</Text>
          <AvatarSelector selectedAvatar={avatar} onSelect={setAvatar} />

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.cta, loading && { opacity: 0.7 }]}
            onPress={handleContinue}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
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
    padding: spacing.lg,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  logo: {
    width: "50%",
    height: undefined,
    aspectRatio: 1,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading1,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  label: {
    color: colors.textSecondary,
    alignSelf: "flex-start",
    marginTop: spacing.md,
    fontSize: 15,
    fontWeight: "500",
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    width: "100%",
    padding: spacing.md,
    borderRadius: 8,
    marginTop: 6,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  option: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginRight: 10,
    marginBottom: 10,
  },
  optionActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    width: "100%",
    borderRadius: 8,
    alignItems: "center",
  },
  ctaText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.error,
    alignSelf: "flex-start",
    fontSize: 13,
    marginTop: 4,
  },
});

export default OnboardingScreen;
