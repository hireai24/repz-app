import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Animated,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { UserContext } from "../context/UserContext";
import { XPContext } from "../context/XPContext";
import useStreakTracker from "../hooks/useStreakTracker";
import { getUserPlans } from "../api/userApi";
import XPProgress from "../components/XPProgress";
import TierBadge from "../components/TierBadge";
import ChallengeCard from "../components/ChallengeCard";
import DailyChallengeCard from "../components/DailyChallengeCard";
import UserPlanCard from "../components/UserPlanCard";
import TrophyModal from "../components/TrophyModal";
import useBounceXP from "../animations/bounceXP";
import useFadeIn from "../animations/fadeIn";
import { useTierAccess } from "../hooks/useTierAccess";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import colors from "../theme/colors";
import i18n from "../locales/i18n";
import { db } from "../firebase/firebaseClient"; // ✅ FIXED IMPORT

const STREAK_MILESTONES = [3, 7, 14];

const DashboardScreen = () => {
  const { userProfile, userId } = useContext(UserContext);
  const {
    xp,
    level,
    xpToNext,
    addXP,
    applyStreakBonus
  } = useContext(XPContext);
  const { triggerBounce, scale } = useBounceXP();
  const fadeAnim = useFadeIn(200);
  const { allowed } = useTierAccess("Free");
  const navigation = useNavigation();

  const [ownedPlans, setOwnedPlans] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [showTrophy, setShowTrophy] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const name = userProfile?.username || i18n.t("dashboard.defaultName");
  const avatar =
    userProfile?.profilePicture || require("../assets/avatars/avatar1.png");

  const nextWorkout = i18n.t("dashboard.nextWorkoutTitle");
  const challenge = {
    title: i18n.t("dashboard.challengeTitle"),
    status: "Active",
    xpReward: 120,
  };

  const { streak } = useStreakTracker(userId);

  useEffect(() => {
    if (!userId || !streak || streak < 3) return;

    const checkMilestone = async () => {
      const docRef = doc(db, "users", userId);
      const userSnap = await getDoc(docRef);
      const lastTrophy = userSnap.data()?.lastTrophyShown || 0;

      if (
        STREAK_MILESTONES.includes(streak) &&
        streak > lastTrophy
      ) {
        setCurrentMilestone(streak);
        setShowTrophy(true);
        await updateDoc(docRef, { lastTrophyShown: streak });
        await applyStreakBonus(streak);
      }
    };

    checkMilestone().catch(console.error);
  }, [userId, streak]);

  const loadPlans = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError("");
      const result = await getUserPlans(userId);
      if (result.success) {
        setOwnedPlans(result.plans);
      } else {
        setError(i18n.t("dashboard.errorLoadingPlans"));
      }
    } catch {
      setError(i18n.t("dashboard.errorLoadingPlans"));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadDailyChallenge = useCallback(async () => {
    if (!userId) return;
    try {
      const ref = doc(db, "dailyChallenges", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setDailyChallenge(snap.data());
      }
    } catch (err) {
      console.warn("Failed to fetch daily challenge", err);
    }
  }, [userId]);

  const completeDailyChallenge = async () => {
    if (!userId || !dailyChallenge || dailyChallenge.completed) return;
    try {
      await updateDoc(doc(db, "dailyChallenges", userId), { completed: true });
      await addXP(dailyChallenge.xp || 50);
      setDailyChallenge((prev) => ({ ...prev, completed: true }));
    } catch (err) {
      console.warn("Error completing daily challenge", err);
    }
  };

  useEffect(() => {
    triggerBounce();
  }, [xp]);

  useEffect(() => {
    loadPlans();
    loadDailyChallenge();
  }, [loadPlans, loadDailyChallenge]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadPlans(), loadDailyChallenge()]).finally(() =>
      setRefreshing(false)
    );
  }, [loadPlans, loadDailyChallenge]);

  if (!allowed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.locked}>{i18n.t("dashboard.tierLock")}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.welcome}>{i18n.t("dashboard.welcome")}</Text>
            <Text style={styles.name}>{name}</Text>
          </View>
          <TierBadge tier={userProfile?.tier} />
        </Animated.View>

        <View style={styles.section}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <XPProgress xp={xp} level={level} xpToNext={xpToNext} />
          </Animated.View>
        </View>

        {dailyChallenge && (
          <View style={styles.section}>
            <DailyChallengeCard
              challenge={dailyChallenge}
              onComplete={completeDailyChallenge}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("dashboard.nextWorkout")}</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("WorkoutLog")}
          >
            <Text style={styles.cardText}>{nextWorkout}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("dashboard.challenges")}</Text>
          <ChallengeCard challenge={challenge} progress={{}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("dashboard.myPlans")}</Text>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : ownedPlans.length === 0 ? (
            <Text style={styles.emptyText}>{i18n.t("dashboard.noPlans")}</Text>
          ) : (
            <FlatList
              data={ownedPlans}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserPlanCard
                  plan={item}
                  onPress={() =>
                    navigation.navigate("PlanDetails", { plan: item })
                  }
                />
              )}
              scrollEnabled={false}
              contentContainerStyle={styles.planListContent}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("dashboard.gymsNearby")}</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("GymDirectory")}
          >
            <Text style={styles.cardText}>{i18n.t("dashboard.viewGyms")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t("dashboard.findTrainingPartner")}
          </Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("PartnerFinder")}
          >
            <Text style={styles.cardText}>
              {i18n.t("dashboard.viewPartners")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("dashboard.proTools")}</Text>
          <View style={styles.toolRow}>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => navigation.navigate("PlanBuilder")}
            >
              <Text style={styles.toolText}>
                {i18n.t("dashboard.toolPlanBuilder")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => navigation.navigate("FormGhost")}
            >
              <Text style={styles.toolText}>
                {i18n.t("dashboard.toolFormGhost")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => navigation.navigate("VisualGains")}
            >
              <Text style={styles.toolText}>
                {i18n.t("dashboard.toolVisualGains")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={() => navigation.navigate("UserPlans")}
            >
              <Text style={styles.toolText}>
                {i18n.t("dashboard.toolUserPlans")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("dashboard.feed")}</Text>
          <TextInput
            style={styles.input}
            placeholder={i18n.t("dashboard.feedPlaceholder")}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.navBar}>
          {["🏠", "🏋️", "⚔️", "🧑‍🤝‍🧑", "⚙️"].map((icon, idx) => (
            <TouchableOpacity
              key={idx}
              accessibilityRole="tab"
              accessibilityLabel={`Nav icon ${idx}`}
            >
              <Text style={styles.navIcon}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {showTrophy && currentMilestone && (
        <TrophyModal
          milestone={currentMilestone}
          onClose={() => {
            setShowTrophy(false);
            setCurrentMilestone(null);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  welcome: {
    ...typography.body,
    color: colors.textSecondary,
  },
  name: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
  },
  cardText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing.md,
    borderRadius: 8,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    borderTopColor: colors.surface,
    borderTopWidth: 1,
    marginTop: spacing.sm,
  },
  navIcon: {
    color: colors.primary,
    fontSize: 22,
  },
  locked: {
    color: colors.textSecondary,
    padding: spacing.lg,
    fontSize: 16,
    textAlign: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 14,
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
    fontSize: 14,
    marginTop: spacing.md,
  },
  toolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  toolButton: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  toolText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  planListContent: {
    paddingBottom: spacing.lg,
  },
});

export default DashboardScreen;
