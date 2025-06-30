// src/screens/LeaderboardScreen.js

import React, { useEffect, useState, useCallback, useContext } from "react";
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
  Animated,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import useTierAccess from "../hooks/useTierAccess";
import { getTopLifts } from "../api/leaderboardApi";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import avatarFallback from "../assets/avatars/avatar1.png";
import useFadeIn from "../animations/fadeIn";
import trophyIcon from "../assets/icons/trophy.png";

const categories = ["Bench", "Squat", "Deadlift", "Volume", "XP", "Streak"];
const filters = ["Your Gym", "5km", "10km", "25km", "National", "Global"];

const LeaderboardScreen = () => {
  const [category, setCategory] = useState("Bench");
  const [filter, setFilter] = useState("Your Gym");
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRankData, setUserRankData] = useState(null);
  const [error, setError] = useState("");
  const fadeAnim = useFadeIn(300);

  const { allowed } = useTierAccess("Free");
  const { userId, userProfile } = useContext(AuthContext);
  const userGymId = userProfile?.gym;

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getTopLifts(
        category,
        filter,
        filter === "Your Gym" ? userGymId : null
      );

      if (result.success) {
        setLeaders(result.results || []);
        if (
          result.userRank !== undefined &&
          result.userBestLift !== undefined
        ) {
          setUserRankData({
            rank: result.userRank,
            bestLift: result.userBestLift,
          });
        } else {
          setUserRankData(null);
        }
      } else {
        setLeaders([]);
        setError(result.error || i18n.t("leaderboard.errorLoad"));
      }
    } catch (err) {
      setLeaders([]);
      setError(err.message || i18n.t("leaderboard.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [category, filter, userGymId]);

  useEffect(() => {
    if (userId && userProfile) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard, userId, userProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard().finally(() => setRefreshing(false));
  }, [fetchLeaderboard]);

  if (!allowed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.locked}>{i18n.t("leaderboard.lockedMessage")}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.headerRow}>
        <Image source={trophyIcon} style={styles.trophyIcon} />
        <Text style={styles.title}>{i18n.t("leaderboard.title")}</Text>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              category === cat && styles.chipActive,
            ]}
            onPress={() => setCategory(cat)}
          >
            <Text
              style={
                category === cat ? styles.chipTextActive : styles.chipText
              }
            >
              {i18n.t(`leaderboard.category.${cat.toLowerCase()}`, cat)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.chipSmall,
              filter === f && styles.chipActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={
                filter === f ? styles.chipTextActive : styles.chipText
              }
            >
              {i18n.t(`leaderboard.filter.${f.toLowerCase().replace(/\s/g, "")}`, f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
      ) : (
        <FlatList
          data={leaders}
          keyExtractor={(item, index) => item.id || index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <Image
                  source={item.avatar ? { uri: item.avatar } : avatarFallback}
                  style={styles.avatar}
                />
                <View style={styles.info}>
                  <Text style={styles.name}>
                    {item.name || i18n.t("common.unknown")}
                  </Text>
                  <Text style={styles.value}>
                    {item.weight
                      ? `${item.weight} kg • ${item.reps} ${i18n.t("leaderboard.reps")}`
                      : item.value || "N/A"}
                  </Text>
                </View>
                {item.videoUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(item.videoUrl)}
                    style={styles.watchButton}
                  >
                    <Text style={styles.watch}>
                      {i18n.t("leaderboard.watch")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyState}>{i18n.t("leaderboard.empty")}</Text>
          }
          ListFooterComponent={
            userRankData && (
              <View style={styles.yourRankBox}>
                <Text style={styles.yourRankText}>
                  {i18n.t("leaderboard.rank", {
                    category,
                    rank: userRankData.rank,
                  })}
                </Text>
                {userRankData.rank > 1 &&
                  leaders.length > 0 &&
                  userRankData.bestLift?.weight &&
                  leaders[0]?.weight && (
                    <Text style={styles.yourRankSub}>
                      {i18n.t("leaderboard.gainToBreakTop", {
                        value:
                          leaders[0].weight - userRankData.bestLift.weight,
                      })}
                    </Text>
                  )}
              </View>
            )
          }
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  trophyIcon: {
    width: 28,
    height: 28,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  chipRow: {
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSmall: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.md,
  },
  emptyState: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.glassBackground,
    borderRadius: 12,
    marginBottom: spacing.sm,
    padding: spacing.md,
    ...shadows.elevation1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rank: {
    color: colors.accentYellow,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  value: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  watchButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  watch: {
    color: colors.accentGreen,
    fontWeight: "bold",
  },
  yourRankBox: {
    backgroundColor: colors.glassBackground,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.lg,
    ...shadows.elevation1,
  },
  yourRankText: {
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  yourRankSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  locked: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingIndicator: {
    marginTop: spacing.lg,
  },
});

export default LeaderboardScreen;
