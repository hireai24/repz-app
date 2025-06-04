import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getMyGym } from "../api/gymApi";
import { AuthContext } from "../context/AuthContext"; // FIX: Changed to AuthContext for isGymOwner, loading, and authUser
import { UserContext } from "../context/UserContext"; // Keep UserContext if userProfile is needed

import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const GymOwnerLoginScreen = () => {
  const navigation = useNavigation();
  const { authUser, loading: authLoading } = useContext(AuthContext); // Use AuthContext for authUser and loading
  const { userProfile, loadingProfile } = useContext(UserContext); // Use UserContext for userProfile

  const [loading, setLoading] = useState(true); // Local loading state for fetching gym data

  useEffect(() => {
    const checkGymStatus = async () => {
      // If auth or profile is still loading, wait.
      if (authLoading || loadingProfile) {
        setLoading(true); // Keep local loading true
        return;
      }

      // If user is not authenticated, redirect to login
      if (!authUser?.uid) {
        Alert.alert("Unauthorized", "You must be logged in to manage gym profiles.");
        // FIX: Use navigation.replace to prevent going back to this screen
        navigation.replace("Login"); // Or your main AuthNavigator screen
        setLoading(false);
        return;
      }

      // Check if the user has the 'gym' role from their profile
      const isGymOwnerRole = userProfile?.role === "gym";
      if (!isGymOwnerRole) {
          Alert.alert("Access Denied", "Your account is not registered as a gym owner.");
          // FIX: Redirect to dashboard or profile if not a gym owner
          navigation.replace("Main"); // Redirect to the main tab navigator
          setLoading(false);
          return;
      }

      setLoading(true); // Start loading indicator for API call
      try {
        const res = await getMyGym(); // Fetches the current user's gym
        if (res.success && res.gym) {
          navigation.replace("GymProfileScreen", {
            gym: res.gym,
            editable: true, // Mark as editable for the owner
          });
        } else {
          // No gym found for this owner, direct to submission screen
          navigation.replace("GymSubmissionScreen");
        }
      } catch (err) {
        Alert.alert("Error", err.message || "Could not check gym profile.");
        // If an error occurs, perhaps redirect to dashboard or try again option
        navigation.goBack(); // Or a more specific error handling screen
      } finally {
        setLoading(false); // Ensure loading is always false after check
      }
    };

    // Only run if authentication and user profile data have loaded
    if (!authLoading && !loadingProfile) {
        checkGymStatus();
    }
  }, [authUser, authLoading, userProfile, loadingProfile, navigation]); // Added all relevant dependencies

  if (loading) { // Use local loading state for screen rendering
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking gym profile...</Text>
      </View>
    );
  }

  // If we reach here, it means the checks are done and navigation has already happened.
  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
});

export default GymOwnerLoginScreen;