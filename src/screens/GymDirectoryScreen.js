// src/screens/GymDirectoryScreen.js

import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { getGyms } from "../api/gymApi";
import GymCard from "../components/GymCard";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
// ✅ Fixed import to use the actual file you have
import gymIcon from "../assets/gymFeed/gym-icon.png";

const GymDirectoryScreen = () => {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGyms = async () => {
    try {
      const res = await getGyms();
      if (res.success && Array.isArray(res.gyms)) {
        setGyms(res.gyms);
      } else {
        setGyms([]);
      }
    } catch {
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGyms();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image source={gymIcon} style={styles.gymIcon} />
        <Text style={styles.header}>{`Nearby Gyms`}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
      ) : gyms.length === 0 ? (
        <Text style={styles.emptyText}>
          No gyms found nearby. Check back later.
        </Text>
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GymCard gym={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  gymIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
  },
  header: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  loading: {
    marginTop: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
});

export default GymDirectoryScreen;
