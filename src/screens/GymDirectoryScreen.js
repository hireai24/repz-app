import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";

import { getGyms } from "../api/gymApi";
import GymCard from "../components/GymCard";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

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
      <Text style={styles.header}>Nearby Gyms</Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={gyms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GymCard gym={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
});

export default GymDirectoryScreen;
