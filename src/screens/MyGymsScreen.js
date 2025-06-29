// src/screens/MyGymsScreen.js

import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { getGymsByOwner } from "../api/gymApi";
import GymCard from "../components/GymCard";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const MyGymsScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadGyms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGymsByOwner(user?.uid);
      if (res.success) {
        setGyms(res.gyms || []);
      } else {
        throw new Error(res.error || "Failed to load gyms");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) loadGyms();
  }, [user?.uid, loadGyms]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Gym Profiles</Text>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GymCard gym={item} />
          )}
          contentContainerStyle={
            gyms.length === 0 ? styles.emptyWrapper : styles.listContent
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              You haven&apos;t added any gyms yet.
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("GymSubmissionScreen")}
        accessibilityRole="button"
        accessibilityLabel="Add new gym"
      >
        <Text style={styles.addButtonText}>+ Add New Gym</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrapper: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  addButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MyGymsScreen;
