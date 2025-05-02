import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
} from 'react';
import { doc, onSnapshot, updateDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../../backend/firebase/init';
import { AuthContext } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const XPContext = createContext();

const XP_STORAGE_KEY = 'repz_total_xp';

/**
 * Calculate level based on XP, with progressive XP requirements.
 */
const calculateLevel = (xp) => {
  let level = 1;
  let required = 100;
  let remainingXP = xp;

  while (remainingXP >= required) {
    remainingXP -= required;
    level++;
    required = Math.floor(required * 1.2);
  }

  return {
    level,
    currentXP: remainingXP,
    xpToNext: required - remainingXP,
  };
};

export const XPProvider = ({ children }) => {
  const { authUser } = useContext(AuthContext);
  const [totalXP, setTotalXP] = useState(0);
  const [xpError, setXpError] = useState(null);

  useEffect(() => {
    if (!authUser) return;

    const xpRef = doc(db, 'xp', authUser.uid);

    const unsubscribe = onSnapshot(
      xpRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTotalXP(data.total || 0);
          AsyncStorage.setItem(XP_STORAGE_KEY, (data.total || 0).toString());
        } else {
          setDoc(xpRef, { total: 0 }).catch((err) => {
            console.error('🔥 Error initializing XP document:', err);
            setXpError('Failed to initialize XP tracking.');
          });
          setTotalXP(0);
          AsyncStorage.setItem(XP_STORAGE_KEY, '0');
        }
      },
      async (err) => {
        console.error('🔥 XP listener error:', err);
        setXpError('Failed to load XP data.');

        // 🔥 Try loading XP from AsyncStorage as fallback
        try {
          const savedXP = parseInt(await AsyncStorage.getItem(XP_STORAGE_KEY) || '0', 10);
          setTotalXP(savedXP);
        } catch (storageErr) {
          console.error('🔥 AsyncStorage XP fallback failed:', storageErr);
        }
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  const updateXP = async (newXP) => {
    if (!authUser) return;
    try {
      const xpRef = doc(db, 'xp', authUser.uid);
      await updateDoc(xpRef, { total: newXP });
      setTotalXP(newXP);
      await AsyncStorage.setItem(XP_STORAGE_KEY, newXP.toString());
    } catch (err) {
      console.error('🔥 Error updating XP total:', err);
      setXpError('Failed to update XP.');
    }
  };

  const addXP = async (amount) => {
    if (!authUser) return;
    try {
      const xpRef = doc(db, 'xp', authUser.uid);
      await updateDoc(xpRef, { total: increment(amount) });
      setTotalXP((prev) => {
        const updated = prev + amount;
        AsyncStorage.setItem(XP_STORAGE_KEY, updated.toString());
        return updated;
      });
    } catch (err) {
      console.error('🔥 Error adding XP:', err);
      setXpError('Failed to add XP.');
    }
  };

  const resetXP = async () => {
    if (!authUser) return;
    try {
      const xpRef = doc(db, 'xp', authUser.uid);
      await updateDoc(xpRef, { total: 0 });
      setTotalXP(0);
      await AsyncStorage.setItem(XP_STORAGE_KEY, '0');
    } catch (err) {
      console.error('🔥 Error resetting XP:', err);
      setXpError('Failed to reset XP.');
    }
  };

  const addPlanXP = async (type = 'Workout') => {
    const xpMap = {
      Workout: 100,
      Meal: 50,
      Bundle: 150,
    };
    const xpAmount = xpMap[type] || 75;
    await addXP(xpAmount);
  };

  const { level, currentXP, xpToNext } = useMemo(
    () => calculateLevel(totalXP),
    [totalXP]
  );

  const value = useMemo(
    () => ({
      totalXP,
      currentXP,
      xpToNext,
      level,
      addXP,
      resetXP,
      addPlanXP,
      xpError,
    }),
    [totalXP, currentXP, xpToNext, level, xpError]
  );

  return (
    <XPContext.Provider value={value}>
      {children}
    </XPContext.Provider>
  );
};
