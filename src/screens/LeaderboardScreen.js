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
} from "react-native";

import useTierAccess from "../hooks/useTierAccess";
import { AuthContext } from "../context/AuthContext"; // ADDED: Import AuthContext
import { getTopLifts } from "../api/leaderboardApi";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import avatarFallback from "../assets/avatars/avatar1.png";

const categories = ["Bench", "Squat", "Deadlift", "Volume", "XP", "Streak"];
const filters = ["Your Gym", "5km", "10km", "25km", "National", "Global"];

const LeaderboardScreen = () => {
  const [category, setCategory] = useState("Bench");
  const [filter, setFilter] = useState("Your Gym");
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userRankData, setUserRankData] = useState(null); // Changed name for clarity
  const [error, setError] = useState("");
  const { allowed } = useTierAccess("Free");

  const { userId, userProfile } = useContext(AuthContext); // ADDED: Get userId and userProfile
  // Assuming userProfile.gym holds the gymId if the user is associated with one
  const userGymId = userProfile?.gym;

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Pass category, filter, and userGymId when filter is 'Your Gym'
      const result = await getTopLifts(
        category,
        filter,
        filter === "Your Gym" ? userGymId : null,
      );

      if (result.success) {
        setLeaders(result.results || []);
        // Backend now returns userRank and userBestLift directly
        if (
          result.userRank !== undefined &&
          result.userBestLift !== undefined
        ) {
          setUserRankData({
            rank: result.userRank,
            bestLift: result.userBestLift,
          });
        } else {
          setUserRankData(null); // User might not have an entry
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
  }, [category, filter, userGymId]); // ADDED: userGymId to dependencies

  useEffect(() => {
    // Only fetch if userId is available and userProfile is loaded (from AuthContext)
    if (userId !== undefined && userProfile !== undefined) {
      fetchLeaderboard();
    }
  }, [fetchLeaderboard, userId, userProfile]); // ADDED: userId and userProfile to dependencies

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
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("leaderboard.title")}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollRow}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
            accessibilityRole="button"
          >
            <Text
              style={category === cat ? styles.chipTextActive : styles.chipText}
            >
              {i18n.t(`leaderboard.category.${cat.toLowerCase()}`, cat)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollRow}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chipSmall, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
            accessibilityRole="button"
          >
            <Text
              style={filter === f ? styles.chipTextActive : styles.chipText}
            >
              {i18n.t(
                `leaderboard.filter.${f.toLowerCase().replace(/\s/g, "")}`,
                f,
              )}
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
          style={styles.loader}
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
            <View style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Image
                source={{ uri: item.avatar || "" }} // Assuming 'avatar' field in leaderboard entry
                defaultSource={avatarFallback}
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
              {item.videoUrl && ( // CHANGED: From item.video to item.videoUrl
                <TouchableOpacity
                  onPress={() => Linking.openURL(item.videoUrl)}
                >
                  <Text style={styles.watch}>
                    {i18n.t("leaderboard.watch")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyState}>{i18n.t("leaderboard.empty")}</Text>
          }
          ListFooterComponent={
            userRankData &&
            userRankData.rank !== null && ( // Use userRankData
              <View style={styles.yourRankBox}>
                <Text style={styles.yourRankText}>
                  {i18n.t("leaderboard.rank", {
                    category,
                    rank: userRankData.rank,
                  })}
                </Text>
                {/* Calculate 'toTop' based on userRankData.bestLift and leaders[0] */}
                {userRankData.rank > 1 &&
                  leaders.length > 0 &&
                  userRankData.bestLift?.weight &&
                  leaders[0]?.weight && (
                    <Text style={styles.yourRankSub}>
                      {i18n.t("leaderboard.gainToBreakTop", {
                        value: leaders[0].weight - userRankData.bestLift.weight,
                      })}
                    </Text>
                  )}
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 999,
    height: 44,
    marginRight: 12,
    width: 44,
  },
  centered: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginBottom: 6,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipSmall: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    marginBottom: 6,
    marginRight: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: "bold",
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  emptyState: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  info: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  loader: {
    marginTop: spacing.lg,
  },
  locked: {
    color: colors.textSecondary,
    fontSize: 16,
    paddingHorizontal: spacing.lg,
    textAlign: "center",
  },
  name: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  rank: {
    color: colors.accentYellow,
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 12,
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    flexDirection: "row",
    marginBottom: 12,
    padding: spacing.md,
  },
  scrollRow: {
    marginBottom: 12,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  value: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  watch: {
    color: colors.accentGreen,
    fontWeight: "bold",
  },
  yourRankBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  yourRankSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  yourRankText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default LeaderboardScreen;
