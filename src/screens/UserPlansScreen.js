import React, { useContext, useEffect, useState } from "react";
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
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../firebase/firebaseClient"; // ✅ FIXED IMPORT
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

  useEffect(() => {
    if (userId) {
      loadPlans();
      loadCreatedChallenges();
      loadAcceptedChallenges();
    }
  }, [userId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchUserPlans(userId);
      if (response.success && Array.isArray(response.plans)) {
        setPlans(response.plans);
        await AsyncStorage.setItem(OFFLINE_PLANS_KEY, JSON.stringify(response.plans));
      } else {
        throw new Error(response.error || i18n.t("plans.errorLoading"));
      }
    } catch (err) {
      try {
        const cached = await AsyncStorage.getItem(OFFLINE_PLANS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          setPlans(parsed);
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
  };

  const loadCreatedChallenges = async () => {
    try {
      const q = query(collection(db, "wagerChallenges"), where("creator", "==", userId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCreatedChallenges(data);
    } catch (err) {
      console.error("Failed to fetch created challenges", err);
    }
  };

  const loadAcceptedChallenges = async () => {
    try {
      const q = query(collection(db, "wagerChallenges"), where("opponents", "array-contains", userId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAcceptedChallenges(data);
    } catch (err) {
      console.error("Failed to fetch accepted challenges", err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPlans(), loadCreatedChallenges(), loadAcceptedChallenges()]);
    setRefreshing(false);
  };

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
    } catch (err) {
      setError(i18n.t("plans.deleteFail"));
    }
  };

  const renderChallenge = (item) => (
    <View style={styles.challengeCard}>
      <Text style={styles.challengeTitle}>{item.title || "Unnamed Challenge"}</Text>
      <Text style={styles.challengeDetails}>
        {i18n.t("plans.xpReward")}: {item.wagerXP || item.xp || 0} XP
      </Text>
      <Text style={styles.challengeDetails}>
        {i18n.t("plans.exercise")}: {item.exercise || "N/A"}
      </Text>
      {item.verified && (
        <Text style={styles.verified}>✅ {i18n.t("challengeWager.verifiedByAI")}</Text>
      )}
      {item.flagged && (
        <Text style={styles.flagged}>⚠️ {i18n.t("challengeWager.flagged")}</Text>
      )}
      {item.winStreak && item.winStreak >= 3 && (
        <Text style={styles.streak}>🔥 {i18n.t("trophy.milestone", { days: item.winStreak })}</Text>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading && activeTab === "plans") {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 40 }}
          accessibilityLabel="Loading plans"
        />
      );
    }

    const listMap = {
      plans,
      created: createdChallenges,
      accepted: acceptedChallenges,
    };

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
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      );

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
            >
              <Text style={styles.tabText}>{i18n.t(`plans.tab.${tab}`)}</Text>
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
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: "#fff",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  retryText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  challengeCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
  },
  challengeTitle: {
    ...typography.heading4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  challengeDetails: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  verified: {
    color: colors.accentBlue,
    fontSize: 13,
    marginTop: 4,
  },
  flagged: {
    color: colors.warning,
    fontSize: 13,
    marginTop: 2,
  },
  streak: {
    color: colors.gold,
    fontWeight: "600",
    fontSize: 13,
    marginTop: 4,
  },
});

export default React.memo(UserPlansScreen);
