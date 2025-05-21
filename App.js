// ✅ Hermes-safe polyfills for Buffer, process, URL
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";

if (typeof global.Buffer === "undefined") global.Buffer = Buffer;
if (typeof global.process === "undefined") {
  global.process = {
    env: {},
    nextTick: setImmediate,
  };
}

import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View, Text } from "react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import AuthNavigator from "./src/navigation/AuthNavigator";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { UserProvider } from "./src/context/UserContext";
import { XPProvider } from "./src/context/XPContext";
import { TierProvider } from "./src/context/TierContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

import "./src/locales/i18n";
import "./src/styles/globalStyles";

// ✅ Error fallback UI
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#000",
          }}
        >
          <Text style={{ color: "#fff" }}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <UserProvider>
              <NotificationProvider>
                <XPProvider>
                  <TierProvider>
                    <RootNavigation />
                  </TierProvider>
                </XPProvider>
              </NotificationProvider>
            </UserProvider>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigation() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View
        accessibilityLabel="Loading Screen"
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const MyAppTheme = {
    dark: colors.background === "#0E0E0E",
    colors: {
      ...colors,
    },
  };

  return (
    <NavigationContainer theme={MyAppTheme}>
      <StatusBar style={colors.background === "#0E0E0E" ? "light" : "dark"} />
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
