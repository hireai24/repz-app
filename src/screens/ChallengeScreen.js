import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";

import { getChallenges, submitChallenge } from "../api/challengeApi";
import ChallengeCard from "../components/ChallengeCard";
import LiveChatThread from "../components/LiveChatThread";
import { useTierAccess } from "../hooks/useTierAccess";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import { formatDistanceToNowStrict } from "date-fns";

const PAGE_SIZE = 10;

const ChallengeScreen = () => {
  const [challenges, setChallenges] = useState([]);
  const [displayedChallenges, setDisplayedChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  const { locked } = useTierAccess("Free");

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await getChallenges();
      if (!Array.isArray(data)) throw new Error("Invalid challenge data");

      setChallenges(data);
      setDisplayedChallenges(data.slice(0, PAGE_SIZE));
    } catch {
      setError(i18n.t("challenge.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEnter = async (challengeId) => {
    try {
      await submitChallenge(challengeId);
      setMessage(i18n.t("challenge.successJoin"));
    } catch {
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

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t("challenge.locked")}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const now = new Date();
    const remaining =
      item.expiresAt?.seconds * 1000 - now.getTime() > 0
        ? formatDistanceToNowStrict(new Date(item.expiresAt.seconds * 1000))
        : null;

    return (
      <View style={{ marginBottom: spacing.xl }}>
        <ChallengeCard
          challenge={item}
          progress={item.progress || {}}
          onEnter={() => handleEnter(item.id)}
          onView={() => {
            // TODO: Navigate to challenge detail
          }}
        />

        {item.verified && (
          <Text style={styles.verifiedText}>✅ {i18n.t("challengeWager.verified")}</Text>
        )}
        {item.flagged && (
          <Text style={styles.flaggedText}>⚠️ {i18n.t("challengeWager.flagged")}</Text>
        )}
        {remaining && (
          <Text style={styles.timerText}>
            ⏳ {i18n.t("challenge.timeLeft") || "Time Left"}: {remaining}
          </Text>
        )}

        <LiveChatThread threadId={item.id} />
      </View>
    );
  };

  const screenHeight = Dimensions.get("window").height;

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <Text style={styles.header}>{i18n.t("challenge.header") || "Workout Battles"}</Text>

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
  successText: {
    color: colors.success,
    textAlign: "center",
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  lockedText: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  verifiedText: {
    color: colors.accentBlue,
    fontSize: 13,
    textAlign: "right",
    marginTop: 4,
  },
  flaggedText: {
    color: colors.warning,
    fontSize: 13,
    textAlign: "right",
    marginTop: 2,
  },
  timerText: {
    color: colors.accent,
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
    fontStyle: "italic",
  },
});

export default ChallengeScreen;
