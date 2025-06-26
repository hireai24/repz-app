import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

import { AuthContext } from "../context/AuthContext";
import colors from "../theme/colors";

// Main Tab Screens
import DashboardScreen from "../screens/DashboardScreen";
import WorkoutLogScreen from "../screens/WorkoutLogScreen";
import ChallengeScreen from "../screens/ChallengeScreen";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Stack Only Screens
import PlanBuilderScreen from "../screens/PlanBuilderScreen";
import FormGhostScreen from "../screens/FormGhostScreen";
import VisualGainsScreen from "../screens/VisualGainsScreen";
import UserPlansScreen from "../screens/UserPlansScreen";
import GymDirectoryScreen from "../screens/GymDirectoryScreen";
import GymProfileScreen from "../screens/GymProfileScreen";
import ChallengeSetupScreen from "../screens/ChallengeSetupScreen";
import PartnerFinderScreen from "../screens/PartnerFinderScreen";
import MealPlannerScreen from "../screens/MealPlannerScreen";

// Gym Owner Screens
import MyGymsScreen from "../screens/MyGymsScreen";
import GymSubmissionScreen from "../screens/GymSubmissionScreen";
import GymOwnerLoginScreen from "../screens/GymOwnerLoginScreen";

// Gym Feed Screens
import GymFeedScreen from "../screens/GymFeedScreen";
import GymFeedEditorScreen from "../screens/GymFeedEditorScreen";

// Purchase History
import PurchaseHistoryScreen from "../screens/PurchaseHistoryScreen";

// Onboarding (used for signup/login)
import OnboardingScreen from "../screens/OnboardingScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 10,
  },
});

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Dashboard"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.backgroundDark,
        borderTopColor: colors.borderDark,
        paddingBottom: 6,
        paddingTop: 4,
        height: 64,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "600",
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarIcon: ({ focused, color }) => {
        let iconName;
        switch (route.name) {
          case "Dashboard":
            iconName = focused ? "home" : "home-outline";
            break;
          case "Workout":
            iconName = focused ? "barbell" : "barbell-outline";
            break;
          case "Challenges":
            iconName = focused ? "flame" : "flame-outline";
            break;
          case "Marketplace":
            iconName = focused ? "cart" : "cart-outline";
            break;
          case "Profile":
            iconName = focused ? "person" : "person-outline";
            break;
          default:
            iconName = "ellipse-outline";
        }
        return <Ionicons name={iconName} size={22} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Workout" component={WorkoutLogScreen} />
    <Tab.Screen name="Challenges" component={ChallengeScreen} />
    <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { authUser, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading app...</Text>
      </View>
    );
  }
    const MyAppTheme = {
        dark: colors.background === "#FEFEFE",
        colors: {
            ...colors,
        },
    };
  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authUser ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="PlanBuilder" component={PlanBuilderScreen} />
            <Stack.Screen name="FormGhost" component={FormGhostScreen} />
            <Stack.Screen name="VisualGains" component={VisualGainsScreen} />
            <Stack.Screen name="UserPlans" component={UserPlansScreen} />
            <Stack.Screen name="GymDirectory" component={GymDirectoryScreen} />
            <Stack.Screen
              name="GymProfileScreen"
              component={GymProfileScreen}
            />
            <Stack.Screen
              name="ChallengeSetup"
              component={ChallengeSetupScreen}
            />
            <Stack.Screen
              name="PartnerFinder"
              component={PartnerFinderScreen}
            />
            <Stack.Screen name="MealPlanner" component={MealPlannerScreen} />
            <Stack.Screen name="MyGyms" component={MyGymsScreen} />
            <Stack.Screen
              name="GymSubmissionScreen"
              component={GymSubmissionScreen}
            />
            <Stack.Screen
              name="PurchaseHistory"
              component={PurchaseHistoryScreen}
            />
            <Stack.Screen
              name="GymOwnerLogin"
              component={GymOwnerLoginScreen}
            />
            <Stack.Screen name="GymFeedScreen" component={GymFeedScreen} />
            <Stack.Screen
              name="GymFeedEditorScreen"
              component={GymFeedEditorScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        )}
      </Stack.Navigator>
  );
};

export default AppNavigator;
