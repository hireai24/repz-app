// src/screens/UserPlansScreen.js

import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, query, where, getDocs } from "firebase/firestore";

import { db } from "../firebase/firebaseClient";
import { UserContext } from "../context/UserContext";
import { fetchUserPlans, deleteUserPlan } from "../services/userPlanService";
import PlanCard from "../components/PlanCard";
import useFadeIn from "../animations/fadeIn";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const OFFLINE_PLANS_KEY = "repz_offline_user_plans";

const UserPlansScreen = () => {
  const { userId } = useContext(UserContext);

  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState([]);
  const [createdChallenges, setCreatedChallenges] = useState([]);
  const [acceptedChallenges, setAcceptedChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = useFadeIn(300);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchUserPlans(userId);
      if (response.success && Array.isArray(response.plans)) {
        setPlans(response.plans);
        await AsyncStorage.setItem(
          OFFLINE_PLANS_KEY,
          JSON.stringify(response.plans)
        );
      } else {
        throw new Error(response.error || i18n.t("plans.errorLoading"));
      }
    } catch {
      try {
        const cached = await AsyncStorage.getItem(OFFLINE_PLANS_KEY);
        if (cached) {
          setPlans(JSON.parse(cached));
          setError(i18n.t("plans.offlineMode"));
        } else {
          setError(i18n.t("plans.errorUnexpected"));
        }
      } catch {
        setError(i18n.t("plans.errorUnexpected"));
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadCreatedChallenges = useCallback(async () => {
    try {
      const q = query(
        collection(db, "wagerChallenges"),
        where("creator", "==", userId)
      );
      const snap = await getDocs(q);
      setCreatedChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // Silent
    }
  }, [userId]);

  const loadAcceptedChallenges = useCallback(async () => {
    try {
      const q = query(
        collection(db, "wagerChallenges"),
        where("opponents", "array-contains", userId)
      );
      const snap = await getDocs(q);
      setAcceptedChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // Silent
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadPlans();
      loadCreatedChallenges();
      loadAcceptedChallenges();
    }
  }, [userId, loadPlans, loadCreatedChallenges, loadAcceptedChallenges]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadPlans(),
      loadCreatedChallenges(),
      loadAcceptedChallenges(),
    ]);
    setRefreshing(false);
  }, [loadPlans, loadCreatedChallenges, loadAcceptedChallenges]);

  const handleDelete = async (planId) => {
    try {
      const res = await deleteUserPlan(planId);
      if (res.success) {
        const updated = plans.filter((p) => p.id !== planId);
        setPlans(updated);
        await AsyncStorage.setItem(OFFLINE_PLANS_KEY, JSON.stringify(updated));
      } else {
        setError(res.error || i18n.t("plans.deleteFail"));
      }
    } catch {
      setError(i18n.t("plans.deleteFail"));
    }
  };

  const renderChallenge = (item) => (
    <View style={styles.challengeCard}>
      <Text style={styles.challengeTitle}>
        {item.title || "Unnamed Challenge"}
      </Text>
      <Text style={styles.challengeDetails}>
        {i18n.t("plans.xpReward")}: {item.wagerXP || item.xp || 0} XP
      </Text>
      <Text style={styles.challengeDetails}>
        {i18n.t("plans.exercise")}: {item.exercise || "N/A"}
      </Text>
      {item.verified && (
        <Text style={styles.verified}>
          ✅ {i18n.t("challengeWager.verifiedByAI")}
        </Text>
      )}
      {item.flagged && (
        <Text style={styles.flagged}>
          ⚠️ {i18n.t("challengeWager.flagged")}
        </Text>
      )}
      {item.winStreak && item.winStreak >= 3 && (
        <Text style={styles.streak}>
          🔥 {i18n.t("trophy.milestone", { days: item.winStreak })}
        </Text>
      )}
    </View>
  );

  const renderList = (data, renderFn) =>
    data.length === 0 ? (
      <Text style={styles.emptyText}>{i18n.t("plans.empty")}</Text>
    ) : (
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={renderFn}
        contentContainerStyle={styles.flatListContent}
      />
    );

  const renderContent = () => {
    if (loading && activeTab === "plans") {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />;
    }

    if (error && activeTab === "plans" && plans.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={loadPlans}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>{i18n.t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === "plans") {
      return renderList(plans, ({ item }) => (
        <PlanCard
          plan={item}
          buyerId={userId}
          creatorStripeAccountId={item.creatorStripeAccountId}
          onDelete={() => handleDelete(item.id)}
        />
      ));
    }

    if (activeTab === "created") {
      return renderList(createdChallenges, ({ item }) => renderChallenge(item));
    }

    if (activeTab === "accepted") {
      return renderList(acceptedChallenges, ({ item }) => renderChallenge(item));
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>{i18n.t("plans.title")}</Text>

        <View style={styles.tabRow}>
          {["plans", "created", "accepted"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, activeTab === tab && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {i18n.t(`plans.tab.${tab}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderContent()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  tabBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  loading: {
    marginTop: spacing.lg,
  },
  centered: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  flatListContent: {
    paddingBottom: spacing.xl,
  },
  challengeCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  challengeTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  challengeDetails: {
    ...typography.body,
    color: colors.textSecondary,
  },
  verified: {
    color: colors.success,
    marginTop: spacing.xs,
  },
  flagged: {
    color: colors.warning,
    marginTop: spacing.xs,
  },
  streak: {
    color: colors.accent,
    marginTop: spacing.xs,
  },
});

export default React.memo(UserPlansScreen);
