// ✅ Hermes-safe polyfills for Buffer, process, URL
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";
import PropTypes from "prop-types";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";

import AppNavigator from "../navigation/AppNavigator";
import AuthNavigator from "../navigation/AuthNavigator";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { UserProvider } from "../context/UserContext";
import { XPProvider } from "../context/XPContext";
import { TierProvider } from "../context/TierContext";
import { NotificationProvider } from "../context/NotificationContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";

import "../locales/i18n";
import "../styles/globalStyles";
import themeColors from "../theme/colors";

if (typeof global.Buffer === "undefined") global.Buffer = Buffer;
if (typeof global.process === "undefined") {
  global.process = {
    env: {},
    nextTick: setImmediate,
  };
}

// ✅ Error fallback UI
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Silent fallback in production
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Something went wrong. Please restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

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
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
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
    <>
      <StatusBar style={colors.background === "#0E0E0E" ? "light" : "dark"} />
      {user ? <AppNavigator /> : <AuthNavigator />}
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: "center",
    backgroundColor: themeColors.black,
    flex: 1,
    justifyContent: "center",
  },
  errorText: {
    color: themeColors.white,
    fontSize: 16,
    paddingHorizontal: 20,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
