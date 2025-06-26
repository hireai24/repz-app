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

  // FIX: Wrap in useCallback to safely use in useEffect dependency array
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
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GymCard gym={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              You haven&apos;t added any gyms yet.
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("GymSubmissionScreen")}
      >
        <Text style={styles.buttonText}>+ Add New Gym</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  buttonText: {
    color: colors.white,
    ...typography.buttonText,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  list: {
    flexGrow: 1,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
});

export default MyGymsScreen;
