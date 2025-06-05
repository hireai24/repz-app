import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

import spacing from "../theme/spacing";
import typography from "../theme/typography";

const PurchaseHistoryScreen = () => {
  const { user } = useUser();
  const { colors: themeColors } = useTheme();

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      return token || "";
    } catch (err) {
      // console.error("Failed to get auth token from storage:", err); // Keep commented for production
      return "";
    }
  };

  const fetchPurchases = useCallback(async () => {
    if (!user || !user.uid) {
      // Use user.uid for Firebase Auth ID
      setLoading(false);
      setRefreshing(false);
      setError("User not logged in or ID missing.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("Authentication token missing.");
      }

      // Ensure the API path matches your server.js route registration
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/purchases/${user.uid}`, // Use user.uid
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch purchase history."); // Use data.error from backend
      }

      setPurchases(data.purchases || []);
    } catch (err) {
      // Only log in development for debugging
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("Error fetching purchase history:", err);
      }
      setError(err.message || "Unable to load purchase history.");
      Alert.alert("Error", err.message || "Unable to load purchase history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPurchases();
  }, [fetchPurchases]);

  const renderItem = ({ item }) => (
    <View style={[styles.purchaseItem, { backgroundColor: themeColors.card }]}>
      <Text style={[styles.planName, { color: themeColors.primary }]}>
        {item.planName || "Unknown Plan"} {/* Uses planName from backend */}
      </Text>
      <Text style={[styles.details, { color: themeColors.text }]}>
        Amount: £{item.amount || "N/A"} {/* Amount now formatted by backend */}
      </Text>
      <Text style={[styles.details, { color: themeColors.text }]}>
        Date:{" "}
        {item.purchasedAt // Use purchasedAt as mapped by backend
          ? new Date(item.purchasedAt).toLocaleDateString()
          : "N/A"}
      </Text>
      {item.sessionId && ( // Display sessionId for audit trail
        <Text style={[styles.details, { color: themeColors.text }]}>
          Session ID: {item.sessionId}
        </Text>
      )}
      {item.paymentIntentId && ( // Display paymentIntentId for audit trail
        <Text style={[styles.details, { color: themeColors.text }]}>
          Payment Intent ID: {item.paymentIntentId}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.centered, { backgroundColor: themeColors.background }]}
      >
        <Text style={[styles.errorText, { color: themeColors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id} // Ensure 'id' is unique, or fallback to index. Firestore doc.id is unique.
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: themeColors.text }]}>
            No purchases found.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: spacing.md,
  },
  details: {
    ...typography.body,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    textAlign: "center",
  },
  planName: {
    ...typography.heading4,
    marginBottom: spacing.xs,
  },
  purchaseItem: {
    borderRadius: 8,
    elevation: 2,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
});

export default PurchaseHistoryScreen;
