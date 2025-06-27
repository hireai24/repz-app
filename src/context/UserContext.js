import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, firestore } from "../firebase/firebaseClient";

export const UserContext = createContext({
  userProfile: null,
  setUserProfile: () => {},
  userId: null,
  loadingProfile: true,
  refreshUserProfile: async () => {},
  currentGym: null,
  currentChallenges: [],
  setCurrentChallenges: () => {},
  pendingSessions: [],
  setPendingSessions: () => {},
  dailyChallenge: null,
  isAdmin: false,
  isGymOwner: false,
});

const USER_PROFILE_STORAGE_KEY = "repz_user_profile";
const DAILY_CHALLENGE_STORAGE_KEY = "repz_daily_challenge";

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentChallenges, setCurrentChallenges] = useState([]);
  const [pendingSessions, setPendingSessions] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoadingProfile(true);
      try {
        if (user?.uid) {
          const uid = user.uid;
          setUserId(uid);
          await Promise.all([loadUserProfile(uid), loadDailyChallenge(uid)]);
        } else {
          setUserId(null);
          setUserProfile(null);
          setDailyChallenge(null);
          await AsyncStorage.multiRemove([
            USER_PROFILE_STORAGE_KEY,
            DAILY_CHALLENGE_STORAGE_KEY,
          ]);
        }
      } catch (err) {
        console.error("Auth context error:", err);
        setUserId(null);
        setUserProfile(null);
        setDailyChallenge(null);
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const userRef = doc(firestore, "users", uid);
      const snap = await getDoc(userRef);

      const battleRef = doc(firestore, "battleStats", uid);
      const battleSnap = await getDoc(battleRef);

      const userData = snap.exists() ? snap.data() : {};
      const battleData = battleSnap.exists() ? battleSnap.data() : {};

      const formattedProfile = {
        id: uid,
        name: userData.name || "",
        email: userData.email || "",
        profilePicture: userData.profilePicture || null,
        avatar: typeof userData.avatar === "number" ? userData.avatar : null,
        stripeAccountId: userData.stripeAccountId || null,
        tier: userData.tier || "Free",
        gym: userData.gym || null,
        goal: userData.goal || "",
        xp: typeof userData.xp === "number" ? userData.xp : 0,
        streak: typeof userData.streak === "number" ? userData.streak : 0,
        isCreator: userData.is_creator || false,
        creatorStats: userData.creator_stats || {},
        role: userData.role || "user",
        wins: battleData.wins || 0,
        losses: battleData.losses || 0,
        currentBattleStreak: battleData.currentStreak || 0,
        bestBattleStreak: battleData.bestStreak || 0,
      };

      setUserProfile(formattedProfile);
      await AsyncStorage.setItem(
        USER_PROFILE_STORAGE_KEY,
        JSON.stringify(formattedProfile)
      );
    } catch (err) {
      console.warn("Failed to fetch profile from Firestore:", err);
      try {
        const cached = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
        setUserProfile(cached ? JSON.parse(cached) : null);
      } catch (err) {
        console.error("Error loading cached profile:", err);
        setUserProfile(null);
      }
    }
  };

  const loadDailyChallenge = async (uid) => {
    try {
      const ref = doc(firestore, "dailyChallenges", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDailyChallenge(data);
        await AsyncStorage.setItem(
          DAILY_CHALLENGE_STORAGE_KEY,
          JSON.stringify(data)
        );
      } else {
        setDailyChallenge(null);
      }
    } catch (err) {
      console.warn("Error fetching daily challenge:", err);
      try {
        const cached = await AsyncStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
        setDailyChallenge(cached ? JSON.parse(cached) : null);
      } catch (err) {
        console.error("Error loading cached challenge:", err);
        setDailyChallenge(null);
      }
    }
  };

  const refreshUserProfile = useCallback(async () => {
    if (!userId) return;
    setLoadingProfile(true);
    await Promise.all([loadUserProfile(userId), loadDailyChallenge(userId)]);
    setLoadingProfile(false);
  }, [userId]);

  const isAdmin = userProfile?.role === "admin";
  const isGymOwner = userProfile?.role === "gymOwner";

  const value = useMemo(
    () => ({
      userProfile,
      setUserProfile,
      userId,
      loadingProfile,
      refreshUserProfile,
      currentGym: userProfile?.gym || null,
      currentChallenges,
      setCurrentChallenges,
      pendingSessions,
      setPendingSessions,
      dailyChallenge,
      isAdmin,
      isGymOwner,
    }),
    [
      userProfile,
      userId,
      loadingProfile,
      refreshUserProfile,
      currentChallenges,
      pendingSessions,
      dailyChallenge,
      isAdmin,
      isGymOwner,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
