import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import LottieView from "lottie-react-native";

import { UserContext } from "../context/UserContext";
import useStreakTracker from "../hooks/useStreakTracker";
import { getUserPlans } from "../api/userPlansApi";
import TierBadge from "../components/TierBadge";
import DailyChallengeCard from "../components/DailyChallengeCard";
import UserPlanCard from "../components/UserPlanCard";
import TrophyModal from "../components/TrophyModal";
import useFadeIn from "../animations/fadeIn";
import i18n from "../locales/i18n";
import { db } from "../firebase/firebaseClient";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import colors from "../theme/colors";
import defaultAvatar from "../assets/avatars/avatar1.png";

const STREAK_MILESTONES = [3, 7, 14];

const DashboardScreen = () => {
  const { userProfile, userId, loadingProfile } = useContext(UserContext);
  const fadeAnim = useFadeIn(200);
  const navigation = useNavigation();

  const [ownedPlans, setOwnedPlans] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [showTrophy, setShowTrophy] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { streak } = useStreakTracker(userId);

  const name =
    userProfile?.name || userProfile?.username || i18n.t("dashboard.defaultName");
  const avatar = userProfile?.profilePicture
    ? { uri: userProfile.profilePicture }
    : defaultAvatar;

  useEffect(() => {
    if (userId) {
      loadPlans();
      loadDailyChallenge();
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !streak || streak < 3) return;

    const checkMilestone = async () => {
      try {
        const docRef = doc(db, "users", userId);
        const userSnap = await getDoc(docRef);
        const lastTrophy = userSnap.data()?.lastTrophyShown || 0;

        if (STREAK_MILESTONES.includes(streak) && streak > lastTrophy) {
          setCurrentMilestone(streak);
          setShowTrophy(true);
          await updateDoc(docRef, { lastTrophyShown: streak });
        }
      } catch {
        // Silent fail
      }
    };

    checkMilestone();
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
    } catch {
      // Silent fail
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([loadPlans(), loadDailyChallenge()]).finally(() =>
      setRefreshing(false)
    );
  }, [loadPlans, loadDailyChallenge]);

  if (loadingProfile || !userId) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
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
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image
            source={require("../assets/dashboard/dashboard-bg.png")}
            style={styles.heroBackground}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Image source={avatar} style={styles.avatarLarge} />
            <Text style={styles.name}>{name}</Text>
            <TierBadge tier={userProfile?.tier} />
            <View style={styles.xpRingWrapper}>
              <LottieView
                source={require("../assets/xp/xp-ring.json")}
                autoPlay
                loop
                style={styles.xpRing}
              />
              <Text style={styles.xpRingLabel}>
                {userProfile?.xp || 0} XP
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Challenge */}
        {dailyChallenge && (
          <View style={styles.section}>
            <DailyChallengeCard challenge={dailyChallenge} />
          </View>
        )}

        {/* My Plans */}
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

        {/* Actions */}
        <View style={styles.sectionRow}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("WorkoutLog")}
          >
            <Text style={styles.cardText}>{i18n.t("dashboard.nextWorkout")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("PartnerFinder")}
          >
            <Text style={styles.cardText}>{i18n.t("dashboard.findTrainingPartner")}</Text>
          </TouchableOpacity>
        </View>

        {/* Pro Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("dashboard.proTools")}</Text>
          <View style={styles.toolRow}>
            {[
              { title: i18n.t("dashboard.toolPlanBuilder"), screen: "PlanBuilder" },
              { title: i18n.t("dashboard.toolFormGhost"), screen: "FormGhost" },
              { title: i18n.t("dashboard.toolVisualGains"), screen: "VisualGains" },
              { title: i18n.t("dashboard.toolUserPlans"), screen: "UserPlans" },
            ].map((tool) => (
              <TouchableOpacity
                key={tool.screen}
                style={styles.toolButton}
                onPress={() => navigation.navigate(tool.screen)}
              >
                <Text style={styles.toolText}>{tool.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Trophy Modal */}
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
    flex: 1,
  },
  heroContainer: {
    position: "relative",
    height: 260,
    marginBottom: spacing.lg,
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  heroContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.sm,
  },
  xpRingWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    marginTop: spacing.sm,
  },
  xpRing: {
    width: 100,
    height: 100,
  },
  xpRingLabel: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    textAlign: "center",
    color: colors.textPrimary,
    ...typography.heading3,
  },
  name: {
    ...typography.heading2,
    color: colors.textOnPrimary,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
    alignItems: "center",
    elevation: 4,
  },
  cardText: {
    color: colors.textPrimary,
    ...typography.body,
  },
  toolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  toolButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    margin: spacing.xs,
  },
  toolText: {
    color: colors.textPrimary,
    ...typography.small,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
  },
  errorText: {
    textAlign: "center",
    color: colors.error,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  planListContent: {
    paddingBottom: spacing.lg,
  },
});

export default DashboardScreen;
