import React, { createContext, useState, useEffect, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth, db } from "../../backend/firebase/init";

export const UserContext = createContext();

const USER_PROFILE_STORAGE_KEY = "repz_user_profile";

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUserId(user.uid);
          await loadUserProfile(user.uid);
        } else {
          setUserId(null);
          setUserProfile(null);
          await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
        }
      } catch {
        setUserId(null);
        setUserProfile(null);
      } finally {
        setLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        const formattedProfile = {
          id: uid,
          name: data.name || "",
          email: data.email || "",
          profilePicture: data.profilePicture || null,
          avatar: typeof data.avatar === "number" ? data.avatar : null,
          stripeAccountId: data.stripeAccountId || null,
          ...data,
        };

        setUserProfile(formattedProfile);
        await AsyncStorage.setItem(
          USER_PROFILE_STORAGE_KEY,
          JSON.stringify(formattedProfile),
        );
      } else {
        setUserProfile(null);
      }
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
    } finally {
      setLoadingProfile(false);
    }
  };

  const refreshUserProfile = async () => {
    if (userId) {
      setLoadingProfile(true);
      await loadUserProfile(userId);
    }
  };

  const value = useMemo(
    () => ({
      userProfile,
      setUserProfile,
      userId,
      loadingProfile,
      refreshUserProfile,
    }),
    [userProfile, userId, loadingProfile, refreshUserProfile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
