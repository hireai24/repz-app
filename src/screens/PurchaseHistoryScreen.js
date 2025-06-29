// src/screens/PurchaseHistoryScreen.js

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
import colors from "../theme/colors";
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
    } catch {
      return "";
    }
  };

  const fetchPurchases = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setRefreshing(false);
      setError("You must be logged in to view purchases.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token missing.");

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/purchases/${user.uid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch purchase history.");
      }

      setPurchases(data.purchases || []);
    } catch (err) {
      if (__DEV__) console.error("Error fetching purchases:", err);
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

  const formatDate = (iso) => {
    if (!iso) return "N/A";
    const date = new Date(iso);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: themeColors.card }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.planName, { color: themeColors.primary }]}>
            {item.planName || "Unknown Plan"}
          </Text>
          <Text style={[styles.detail, { color: themeColors.text }]}>
            £{item.amount?.toFixed(2) || "N/A"}
          </Text>
          <Text style={[styles.detail, { color: themeColors.text }]}>
            {formatDate(item.purchasedAt)}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                item.status === "succeeded"
                  ? colors.successBackground
                  : colors.warningBackground,
              borderColor:
                item.status === "succeeded"
                  ? colors.success
                  : colors.warning,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color:
                  item.status === "succeeded"
                    ? colors.success
                    : colors.warning,
              },
            ]}
          >
            {item.status === "succeeded" ? "Paid" : "Pending"}
          </Text>
        </View>
      </View>
      {item.sessionId && (
        <Text style={[styles.meta, { color: themeColors.text }]}>
          Session: {item.sessionId}
        </Text>
      )}
      {item.paymentIntentId && (
        <Text style={[styles.meta, { color: themeColors.text }]}>
          Payment ID: {item.paymentIntentId}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.error }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={purchases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: themeColors.text }]}>
              No purchases yet.
            </Text>
          </View>
        }
        contentContainerStyle={purchases.length === 0 && styles.flexGrow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    borderRadius: 12,
    elevation: 2,
    marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: {
    flex: 1,
  },
  planName: {
    ...typography.heading4,
  },
  detail: {
    ...typography.body,
  },
  meta: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontWeight: "600",
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    ...typography.body,
    textAlign: "center",
  },
  emptyContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
  },
  flexGrow: {
    flexGrow: 1,
    justifyContent: "center",
  },
});

export default PurchaseHistoryScreen;
