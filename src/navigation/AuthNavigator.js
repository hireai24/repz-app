import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "../screens/OnboardingScreen";
import { AuthContext } from "../context/AuthContext";

import AppNavigator from "./AppNavigator";

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const { userToken, loading } = useContext(AuthContext);

  if (loading) return null; // Prevent flicker on auth check

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        // 🛡️ Auth gate: new users start at onboarding
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        // ✅ Authenticated users go straight to the app
        <Stack.Screen name="MainApp" component={AppNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigator;
