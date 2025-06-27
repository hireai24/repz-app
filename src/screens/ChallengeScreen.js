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
import { formatDistanceToNowStrict } from "date-fns";

import { getChallenges, submitChallenge } from "../api/challengeApi";
import ChallengeCard from "../components/ChallengeCard";
import LiveChatThread from "../components/LiveChatThread";
import useTierAccess from "../hooks/useTierAccess";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
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

  const { userProfile } = useContext(UserContext);
  const { locked, tier } = useTierAccess();

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await getChallenges();

      if (!Array.isArray(data)) throw new Error("Invalid challenge data");

      const sorted = data.sort((a, b) => {
        const statusOrder = { active: 1, upcoming: 2, expired: 3 };
        const statusCompare =
          (statusOrder[a.status?.toLowerCase()] || 99) -
          (statusOrder[b.status?.toLowerCase()] || 99);
        if (statusCompare !== 0) return statusCompare;
        const expiryA = a.expiresAt?.seconds || Infinity;
        const expiryB = b.expiresAt?.seconds || Infinity;
        return expiryA - expiryB;
      });

      setChallenges(sorted);
      setDisplayedChallenges(sorted.slice(0, PAGE_SIZE));
      setPage(1);
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
      onRefresh();
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
    setMessage("");
    loadChallenges().finally(() => setRefreshing(false));
  }, [loadChallenges]);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  if (!userProfile?.id) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.lockedText}>{i18n.t("common.loginRequired")}</Text>
      </View>
    );
  }

  if (locked) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.lockedText}>
          {i18n.t("challenge.tierLocked", { tier: tier || "N/A" })}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const expiryDate = item.expiresAt?.seconds
      ? new Date(item.expiresAt.seconds * 1000)
      : null;
    const remaining =
      expiryDate && expiryDate.getTime() - Date.now() > 0
        ? formatDistanceToNowStrict(expiryDate, { addSuffix: true })
        : null;

    const isParticipant = item.participants?.includes(userProfile.id);
    const progress = item.progress?.[userProfile.id] || {};

    return (
      <View style={styles.cardWrapper}>
        <ChallengeCard
          challenge={item}
          progress={{
            completed: progress.completed,
            inProgress: progress.inProgress,
          }}
          onEnter={() => handleEnter(item.id)}
        />
        <View style={styles.metadata}>
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
              ⏳ {i18n.t("challenge.timeLeft")}: {remaining}
            </Text>
          )}
        </View>
        {isParticipant && <LiveChatThread threadId={item.id} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{i18n.t("challenge.header")}</Text>
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
          ListFooterComponent={
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
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
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
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  cardWrapper: {
    marginBottom: spacing.xl,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...colors.shadow, // apply shadow if desired
  },
  metadata: {
    marginTop: spacing.xs,
  },
  verifiedText: {
    color: colors.accentBlue,
    fontSize: 12,
    textAlign: "right",
  },
  flaggedText: {
    color: colors.warning,
    fontSize: 12,
    textAlign: "right",
  },
  timerText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "right",
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
});

export default ChallengeScreen;
