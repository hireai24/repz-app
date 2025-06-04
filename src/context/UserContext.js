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
import { auth, db } from "../firebase/firebaseClient";

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
      try {
        if (user) {
          setUserId(user.uid);
          await Promise.all([
            loadUserProfile(user.uid),
            loadDailyChallenge(user.uid),
          ]);
        } else {
          setUserId(null);
          setUserProfile(null);
          setDailyChallenge(null);
          await AsyncStorage.multiRemove([
            USER_PROFILE_STORAGE_KEY,
            DAILY_CHALLENGE_STORAGE_KEY,
          ]);
        }
      } catch {
        setUserId(null);
        setUserProfile(null);
        setDailyChallenge(null);
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      const battleRef = doc(db, "battleStats", uid);
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
        role: userData.role || "user", // ✅ new
        wins: battleData.wins || 0,
        losses: battleData.losses || 0,
        currentBattleStreak: battleData.currentStreak || 0,
        bestBattleStreak: battleData.bestStreak || 0,
      };

      setUserProfile(formattedProfile);
      await AsyncStorage.setItem(
        USER_PROFILE_STORAGE_KEY,
        JSON.stringify(formattedProfile),
      );
    } catch {
      try {
        const cached = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (cached) {
          setUserProfile(JSON.parse(cached));
        } else {
          setUserProfile(null);
        }
      } catch {
        setUserProfile(null);
      }
    }
  };

  const loadDailyChallenge = async (uid) => {
    try {
      const ref = doc(db, "dailyChallenges", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDailyChallenge(data);
        await AsyncStorage.setItem(
          DAILY_CHALLENGE_STORAGE_KEY,
          JSON.stringify(data),
        );
      } else {
        setDailyChallenge(null);
      }
    } catch {
      try {
        const cached = await AsyncStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
        if (cached) {
          setDailyChallenge(JSON.parse(cached));
        } else {
          setDailyChallenge(null);
        }
      } catch {
        setDailyChallenge(null);
      }
    }
  };

  const refreshUserProfile = useCallback(async () => {
    if (userId) {
      setLoadingProfile(true);
      await Promise.all([loadUserProfile(userId), loadDailyChallenge(userId)]);
      setLoadingProfile(false);
    }
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
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
