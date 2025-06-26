import React, { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { getChallenges, submitChallenge } from "../api/challengeApi";
import ChallengeCard from "../components/ChallengeCard";
import LiveChatThread from "../components/LiveChatThread";
import useTierAccess from "../hooks/useTierAccess";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import { formatDistanceToNowStrict } from "date-fns";
import { UserContext } from "../context/UserContext";

const PAGE_SIZE = 10;

const ChallengeScreen = () => {
  const [challenges, setChallenges] = useState([]);
  const [displayedChallenges, setDisplayedChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  const { userProfile,userId } = useContext(UserContext);
  const { locked, tier } = useTierAccess();

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      console.log("FFFF");
      const data = await getChallenges();

      console.log("SSSSSS", data);
      if (!Array.isArray(data)) throw new Error("Invalid challenge data");

      const sortedChallenges = data.sort((a, b) => {
        const statusOrder = { active: 1, upcoming: 2, expired: 3 };
        const statusCompare =
          (statusOrder[a.status?.toLowerCase()] || 99) -
          (statusOrder[b.status?.toLowerCase()] || 99);
        if (statusCompare !== 0) return statusCompare;
        const expiryA = a.expiresAt?.seconds || Infinity;
        const expiryB = b.expiresAt?.seconds || Infinity;
        return expiryA - expiryB;
      });

      setChallenges(sortedChallenges);
      setDisplayedChallenges(sortedChallenges.slice(0, PAGE_SIZE));
      setPage(1);
    } catch (e) {
      setError(i18n.t("challenge.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEnter = async (challengeId) => {
    try {
      await submitChallenge(challengeId);
      setMessage(i18n.t("challenge.successJoin"));
      onRefresh();
    } catch (e) {
      setError(i18n.t("challenge.submitFail"));
    }
  };

  const handleLoadMore = () => {
    if (loading || refreshing) return;
    const nextPage = page + 1;
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    if (start >= challenges.length) return;
    setDisplayedChallenges((prev) => [
      ...prev,
      ...challenges.slice(start, end),
    ]);
    setPage(nextPage);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setMessage("");
    loadChallenges().finally(() => setRefreshing(false));
  }, [loadChallenges]);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges]),
  );

  console.log("userProfile", userProfile, userId)

  if (!userProfile?.id) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>
          {i18n.t("common.loginRequired") ||
            "Please log in to view challenges."}
        </Text>
      </View>
    );
  }
  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>
          {i18n.t("challenge.tierLocked") ||
            `Access to challenges requires a minimum tier. Current tier: ${tier || "N/A"}`}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const now = new Date();
    const expiryDate = item.expiresAt?.seconds
      ? new Date(item.expiresAt.seconds * 1000)
      : null;
    const remaining =
      expiryDate && expiryDate.getTime() - now.getTime() > 0
        ? formatDistanceToNowStrict(expiryDate, { addSuffix: true })
        : null;

    const isParticipant = item.participants?.includes(userProfile?.id);
    const userProgress = item.progress?.[userProfile?.id];
    const isChallengeCompleted = userProgress?.completed;
    const isChallengeInProgress = userProgress?.inProgress;

    return (
      <View style={{ marginBottom: spacing.xl }}>
        <ChallengeCard
          challenge={item}
          progress={{
            completed: isChallengeCompleted,
            inProgress: isChallengeInProgress,
          }}
          onEnter={() => handleEnter(item.id)}
          onView={() => {
            // Navigation logic would go here
            // navigation.navigate('ChallengeDetail', { challengeId: item.id });
          }}
        />

        {item.verified && (
          <Text style={styles.verifiedText}>
            ✅ {i18n.t("challengeWager.verified")}
          </Text>
        )}
        {item.flagged && (
          <Text style={styles.flaggedText}>
            ⚠️ {i18n.t("challengeWager.flagged")}
          </Text>
        )}
        {remaining && (
          <Text style={styles.timerText}>
            ⏳ {i18n.t("challenge.timeLeft") || "Time Left"}: {remaining}
          </Text>
        )}
        {isParticipant && <LiveChatThread threadId={item.id} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {i18n.t("challenge.header") || "Challenges"}
      </Text>
      {message ? (
        <Text style={styles.successText}>{message}</Text>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : displayedChallenges.length === 0 ? (
        <Text style={styles.emptyText}>{i18n.t("challenge.noChallenges")}</Text>
      ) : (
        <FlatList
          data={displayedChallenges}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={() =>
            loading && !refreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : null
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
  emptyText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  flaggedText: {
    color: colors.warning,
    fontSize: 13,
    marginTop: 2,
    textAlign: "right",
  },
  header: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  lockedContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  successText: {
    color: colors.success,
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  timerText: {
    color: colors.accent,
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
    textAlign: "right",
  },
  verifiedText: {
    color: colors.accentBlue,
    fontSize: 13,
    marginTop: 4,
    textAlign: "right",
  },
});

export default ChallengeScreen;
