import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../backend/firebase/init';
import { db } from '../../backend/firebase/init';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserContext = createContext();

const USER_PROFILE_STORAGE_KEY = 'repz_user_profile';

export const UserProvider = ({ children }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadUserProfile(user.uid);
      } else {
        setUserId(null);
        setUserProfile(null);
        setLoadingProfile(false);
        await AsyncStorage.removeItem(USER_PROFILE_STORAGE_KEY);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const formattedProfile = {
          id: uid,
          name: data.name || '',
          email: data.email || '',
          profilePicture: data.profilePicture || null,
          avatar: typeof data.avatar === 'number' ? data.avatar : null,
          stripeAccountId: data.stripeAccountId || null,
          ...data,
        };
        setUserProfile(formattedProfile);
        await AsyncStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(formattedProfile));
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.error('Failed to load user profile from Firestore:', err);

      // 🔥 Fallback: Try loading from AsyncStorage
      try {
        const cachedProfile = await AsyncStorage.getItem(USER_PROFILE_STORAGE_KEY);
        if (cachedProfile) {
          setUserProfile(JSON.parse(cachedProfile));
        } else {
          setUserProfile(null);
        }
      } catch (storageErr) {
        console.error('Fallback: Failed to load cached user profile:', storageErr);
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
    [userProfile, userId, loadingProfile]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
