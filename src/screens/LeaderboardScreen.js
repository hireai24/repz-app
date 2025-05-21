import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Linking,
} from "react-native";

import { useTierAccess } from "../hooks/useTierAccess";
import { getTopLifts } from "../api/leaderboardApi";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const categories = ["Bench", "Squat", "Deadlift", "Volume", "XP", "Streak"];
const filters = ["Your Gym", "5km", "10km", "25km", "National", "Global"];

const LeaderboardScreen = () => {
  const [category, setCategory] = useState("Bench");
  const [filter, setFilter] = useState("Your Gym");
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [error, setError] = useState("");
  const { allowed } = useTierAccess("Free");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getTopLifts(category, filter);
      if (result.success) {
        setLeaders(result.results || []);
        setUserRank(result.user || null);
      } else {
        setLeaders([]);
        setError(i18n.t("leaderboard.errorLoad"));
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      setLeaders([]);
      setError(i18n.t("leaderboard.errorLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [category, filter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard().finally(() => setRefreshing(false));
  }, [category, filter]);

  if (!allowed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.locked}>{i18n.t("leaderboard.lockedMessage")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("leaderboard.title")}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
            accessibilityRole="button"
          >
            <Text style={category === cat ? styles.chipTextActive : styles.chipText}>
              {i18n.t(`leaderboard.category.${cat.toLowerCase()}`, cat)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chipSmall, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
          >
            <Text style={filter === f ? styles.chipTextActive : styles.chipText}>
              {i18n.t(`leaderboard.filter.${f.toLowerCase().replace(/\s/g, "")}`, f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={(item, index) => item.id || index.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Image
                source={{ uri: item.avatar || "https://via.placeholder.com/40" }}
                style={styles.avatar}
                defaultSource={require("../assets/avatars/avatar1.png")}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name || i18n.t("common.unknown")}</Text>
                <Text style={styles.value}>
                  {item.weight
                    ? `${item.weight} kg • ${item.reps} ${i18n.t("leaderboard.reps")}`
                    : item.value || "N/A"}
                </Text>
              </View>
              {item.video && (
                <TouchableOpacity onPress={() => Linking.openURL(item.video)}>
                  <Text style={styles.watch}>{i18n.t("leaderboard.watch")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyState}>{i18n.t("leaderboard.empty")}</Text>
          }
          ListFooterComponent={
            userRank && (
              <View style={styles.yourRankBox}>
                <Text style={styles.yourRankText}>
                  {i18n.t("leaderboard.rank", { category, rank: userRank.rank })}
                </Text>
                <Text style={styles.yourRankSub}>
                  {i18n.t("leaderboard.gainToBreakTop", { value: userRank.toTop })}
                </Text>
              </View>
            )
          }
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  locked: {
    color: colors.textSecondary,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  scrollRow: {
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 6,
  },
  chipSmall: {
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: "#aaa",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: 12,
  },
  rank: {
    color: "#FFD166",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    marginRight: 12,
  },
  name: {
    color: "#fff",
    fontWeight: "600",
  },
  value: {
    color: "#aaa",
    fontSize: 12,
  },
  watch: {
    color: "#43AA8B",
    fontWeight: "bold",
  },
  yourRankBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    marginTop: spacing.lg,
  },
  yourRankText: {
    color: colors.textPrimary,
    fontWeight: "bold",
    fontSize: 15,
  },
  yourRankSub: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: spacing.lg,
  },
  emptyState: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
    fontSize: 14,
  },
});

export default LeaderboardScreen;
