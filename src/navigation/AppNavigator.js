// Add Text import
import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import DashboardScreen from "../screens/DashboardScreen";
import WorkoutLogScreen from "../screens/WorkoutLogScreen";
import ChallengeScreen from "../screens/ChallengeScreen";
import MarketplaceScreen from "../screens/MarketplaceScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PlanBuilderScreen from "../screens/PlanBuilderScreen";
import FormGhostScreen from "../screens/FormGhostScreen";
import VisualGainsScreen from "../screens/VisualGainsScreen";
import UserPlansScreen from "../screens/UserPlansScreen";
import GymDirectoryScreen from "../screens/GymDirectoryScreen";
import GymProfileScreen from "../screens/GymProfileScreen";
import ChallengeSetupScreen from "../screens/ChallengeSetupScreen";
import PartnerFinderScreen from "../screens/PartnerFinderScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Dashboard"
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: "#000",
        borderTopColor: "#111",
        paddingBottom: 6,
        paddingTop: 4,
        height: 64,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "600",
      },
      tabBarActiveTintColor: "#E63946",
      tabBarInactiveTintColor: "#777",
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

  if (loading || !authUser) return null; // Consider adding a loading screen
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="PlanBuilder" component={PlanBuilderScreen} />
        <Stack.Screen name="FormGhost" component={FormGhostScreen} />
        <Stack.Screen name="VisualGains" component={VisualGainsScreen} />
        <Stack.Screen name="UserPlans" component={UserPlansScreen} />
        <Stack.Screen name="GymDirectory" component={GymDirectoryScreen} />
        <Stack.Screen name="GymProfile" component={GymProfileScreen} />
        <Stack.Screen name="ChallengeSetup" component={ChallengeSetupScreen} />
        <Stack.Screen name="PartnerFinder" component={PartnerFinderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
