// src/screens/ChallengeScreen.js
import React, { useEffect, useState, useCallback, useContext } from "react"; // Import useContext
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect

import { getChallenges, submitChallenge } from "../api/challengeApi";
import ChallengeCard from "../components/ChallengeCard";
import LiveChatThread from "../components/LiveChatThread";
import { useTierAccess } from "../hooks/useTierAccess";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import { formatDistanceToNowStrict } from "date-fns";
import { UserContext } from "../context/UserContext"; // Import UserContext to get userId

const PAGE_SIZE = 10;

const ChallengeScreen = () => {
  const [challenges, setChallenges] = useState([]);
  const [displayedChallenges, setDisplayedChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);

  const { userProfile } = useContext(UserContext); // Get userProfile for userId
  const { locked, tier } = useTierAccess(); // Get tier access details
  // Assuming 'Free' tier means basic access, if a higher tier is required for certain features
  // you might pass a specific requiredTier to useTierAccess().
  // If the screen should be locked for FREE, then `locked` from `useTierAccess("Free")` is correct.
  // For this fix, I'll assume that having *any* tier (including Free) grants access to the screen.
  // If a specific premium feature *within* the screen is locked, you'd use `locked` there.

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await getChallenges();
      if (!Array.isArray(data)) throw new Error("Invalid challenge data");

      // Sort challenges, e.g., active first, then by expiry, etc.
      // This is a common pattern for lists. Example:
      const sortedChallenges = data.sort((a, b) => {
        const statusOrder = { active: 1, upcoming: 2, expired: 3 };
        const statusCompare =
          (statusOrder[a.status?.toLowerCase()] || 99) -
          (statusOrder[b.status?.toLowerCase()] || 99);
        if (statusCompare !== 0) return statusCompare;

        // Then by expiry date (closer expiry first for active)
        const expiryA = a.expiresAt?.seconds || Infinity;
        const expiryB = b.expiresAt?.seconds || Infinity;
        return expiryA - expiryB;
      });

      setChallenges(sortedChallenges);
      setDisplayedChallenges(sortedChallenges.slice(0, PAGE_SIZE));
      setPage(1); // Reset page on full load
    } catch (e) { // Catch the actual error
      console.error("Failed to load challenges:", e); // Log for debugging
      setError(i18n.t("challenge.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleEnter = async (challengeId) => {
    try {
      // NOTE: `submitChallenge` in `challengeApi.js` currently directly updates Firestore.
      // If XP deduction, backend verification, or complex state changes are needed,
      // this should ideally call a backend API endpoint (e.g., `/api/challenges/submit`).
      await submitChallenge(challengeId);
      setMessage(i18n.t("challenge.successJoin"));
      // Optionally re-fetch or update the specific challenge in state
      // For now, re-fetching all challenges to ensure updated state
      onRefresh();
    } catch (e) {
      console.error("Failed to submit challenge:", e); // Log for debugging
      setError(i18n.t("challenge.submitFail"));
    }
  };

  const handleLoadMore = () => {
    if (loading || refreshing) return;
    const nextPage = page + 1;
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    if (start >= challenges.length) return; // No more items to load

    setDisplayedChallenges((prev) => [
      ...prev,
      ...challenges.slice(start, end),
    ]);
    setPage(nextPage);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1); // Reset page when refreshing
    setMessage("");
    loadChallenges().finally(() => setRefreshing(false));
  }, [loadChallenges]);

  // Use useFocusEffect to reload data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  // If the intention is to lock challenges based on tier, ensure this logic is correct.
  // For a general "Challenges" screen, typically it's open to all, with certain challenges
  // or features within them being tier-locked.
  // Assuming a baseline access (e.g., 'Free' or any tier means access).
  // If the entire screen should be locked for users *without* the 'Free' tier,
  // then the original `if (locked)` check was correct.
  // I'm modifying this to check if userProfile and userId exist,
  // as the context is tied to logged-in users.
  if (!userProfile?.uid) { // Check if user is logged in
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t("common.loginRequired") || "Please log in to view challenges."}</Text>
      </View>
    );
  }
  // If useTierAccess("Free") implies that users *without* free (i.e., anonymous)
  // access are locked out, the previous `if (locked)` was sufficient.
  // If it means 'Free' is the *minimum* tier for access, then the `locked` value is correct.
  // I'll keep the `useTierAccess` hook call but make the lock message more generic if needed.
  // The current hook returns `locked` based on the specified tier.
  // If "Free" tier is required, and `locked` is true, it means they don't even have "Free".
  if (locked) { // If useTierAccess("Free") returns true for 'locked'
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>
          {i18n.t("challenge.tierLocked") || `Access to challenges requires a minimum tier. Current tier: ${tier || "N/A"}`}
        </Text>
      </View>
    );
  }


  const renderItem = ({ item }) => {
    const now = new Date();
    // Check if expiresAt is a Firebase Timestamp and convert it
    const expiryDate = item.expiresAt?.seconds ? new Date(item.expiresAt.seconds * 1000) : null;
    const remaining =
      expiryDate && expiryDate.getTime() - now.getTime() > 0
        ? formatDistanceToNowStrict(expiryDate, { addSuffix: true }) // Added suffix for "in X days"
        : null;

    // Determine current user's participation status
    const isParticipant = item.participants?.includes(userProfile?.uid);
    // Determine if the challenge is completed based on current user's progress
    const userProgress = item.progress?.[userProfile?.uid]; // Assuming progress is an object keyed by userId
    const isChallengeCompleted = userProgress?.completed;
    const isChallengeInProgress = userProgress?.inProgress;


    return (
      <View style={{ marginBottom: spacing.xl }}>
        <ChallengeCard
          challenge={item}
          // Pass the specific user's progress for this challenge
          progress={{ completed: isChallengeCompleted, inProgress: isChallengeInProgress }}
          onEnter={() => handleEnter(item.id)}
          onView={() => {
            // TODO: Navigate to challenge detail screen, passing item.id
            console.log("Navigating to challenge detail:", item.id);
            // Example: navigation.navigate('ChallengeDetail', { challengeId: item.id });
          }}
        />

        {item.verified && ( // This `verified` field seems more relevant to wager challenges
          <Text style={styles.verifiedText}>
            ✅ {i18n.t("challengeWager.verified")}
          </Text>
        )}
        {item.flagged && ( // This `flagged` field also seems more relevant to wager challenges
          <Text style={styles.flaggedText}>
            ⚠️ {i18n.t("challengeWager.flagged")}
          </Text>
        )}
        {remaining && (
          <Text style={styles.timerText}>
            ⏳ {i18n.t("challenge.timeLeft") || "Time Left"}: {remaining}
          </Text>
        )}

        {/* LiveChatThread for each challenge. Ensure performance is acceptable. */}
        {/* Only show chat if the user is a participant or if chat is generally public */}
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
    flex: 1, // Use flex: 1 instead of minHeight for consistent layout
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