// src/screens/GymOwnerLoginScreen.js

import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getMyGym } from "../api/gymApi";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymOwnerLoginScreen = () => {
  const navigation = useNavigation();
  const { authUser, loading: authLoading } = useContext(AuthContext);
  const { userProfile, loadingProfile } = useContext(UserContext);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGymStatus = async () => {
      if (authLoading || loadingProfile) {
        setLoading(true);
        return;
      }

      if (!authUser?.uid) {
        Alert.alert(
          "Unauthorized",
          "You must be logged in to manage gym profiles."
        );
        navigation.replace("Login");
        setLoading(false);
        return;
      }

      if (userProfile?.role !== "gym") {
        Alert.alert(
          "Access Denied",
          "Your account is not registered as a gym owner."
        );
        navigation.replace("Main");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await getMyGym();
        if (res.success && res.gym) {
          navigation.replace("GymProfileScreen", {
            gym: res.gym,
            editable: true,
          });
        } else {
          navigation.replace("GymSubmissionScreen");
        }
      } catch (err) {
        Alert.alert(
          "Error",
          err.message || "Could not check gym profile."
        );
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && !loadingProfile) {
      checkGymStatus();
    }
  }, [authUser, authLoading, userProfile, loadingProfile, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Checking your gym profile...
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    textAlign: "center",
    ...typography.body,
    color: colors.textPrimary,
  },
});

export default GymOwnerLoginScreen;
