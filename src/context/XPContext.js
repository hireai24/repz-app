import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import {
  doc,
  onSnapshot,
  updateDoc,
  increment,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, firestore } from "../firebase/firebaseClient";
import { AuthContext } from "./AuthContext";

export const XPContext = createContext({
  totalXP: 0,
  currentXP: 0,
  xpToNext: 100,
  level: 1,
  addXP: () => {},
  resetXP: () => {},
  addPlanXP: () => {},
  applyWagerXP: () => {},
  applyStreakBonus: () => {},
  xpError: null,
});

const XP_STORAGE_KEY = "repz_total_xp";

const calculateLevel = (xp) => {
  let level = 1;
  let required = 100;
  let remaining = xp;

  while (remaining >= required) {
    remaining -= required;
    level++;
    required = Math.floor(required * 1.2);
  }

  return {
    level,
    currentXP: remaining,
    xpToNext: Math.max(0, required - remaining),
    xpRequiredForLevel: required,
  };
};

export const XPProvider = ({ children }) => {
  const { authUser } = useContext(AuthContext);
  const [totalXP, setTotalXP] = useState(0);
  const [xpError, setXpError] = useState(null);

  useEffect(() => {
    if (!authUser?.uid) return;

    const xpRef = doc(firestore, "xp", authUser.uid);

    const unsubscribe = onSnapshot(
      xpRef,
      (snap) => {
        const data = snap.data();
        const newXP = data?.total || 0;
        setTotalXP(newXP);
        AsyncStorage.setItem(XP_STORAGE_KEY, newXP.toString());
      },
      async () => {
        setXpError("Failed to load XP data.");
        try {
          const saved = parseInt(
            (await AsyncStorage.getItem(XP_STORAGE_KEY)) || "0",
            10
          );
          setTotalXP(saved);
        } catch {
          setXpError("Failed to restore saved XP.");
        }
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  const addXP = useCallback(
    async (amount) => {
      if (!authUser?.uid) return;
      try {
        const xpRef = doc(firestore, "xp", authUser.uid);
        await updateDoc(xpRef, { total: increment(amount) });
        const updated = totalXP + amount;
        setTotalXP(updated);
        await AsyncStorage.setItem(XP_STORAGE_KEY, updated.toString());
      } catch {
        setXpError("Failed to add XP.");
      }
    },
    [authUser, totalXP]
  );

  const resetXP = useCallback(async () => {
    if (!authUser?.uid) return;
    try {
      const xpRef = doc(firestore, "xp", authUser.uid);
      await updateDoc(xpRef, { total: 0 });
      setTotalXP(0);
      await AsyncStorage.setItem(XP_STORAGE_KEY, "0");
    } catch {
      setXpError("Failed to reset XP.");
    }
  }, [authUser]);

  const addPlanXP = useCallback(
    async (type = "Workout") => {
      const xpMap = { Workout: 100, Meal: 50, Bundle: 150 };
      const xpAmount = xpMap[type] || 75;
      await addXP(xpAmount);
    },
    [addXP]
  );

  const applyWagerXP = useCallback(
    async (win, amount) => {
      if (!authUser?.uid || typeof amount !== "number") return;
      try {
        const delta = win ? amount : -amount;
        const xpRef = doc(firestore, "xp", authUser.uid);
        await updateDoc(xpRef, { total: increment(delta) });
        const newXP = totalXP + delta;
        setTotalXP(newXP);
        await AsyncStorage.setItem(XP_STORAGE_KEY, newXP.toString());
      } catch {
        setXpError("Failed to update wager XP.");
      }
    },
    [authUser, totalXP]
  );

  const applyStreakBonus = useCallback(
    async (milestone) => {
      if (!authUser?.uid || ![3, 7, 14].includes(milestone)) return;
      const bonusMap = { 3: 50, 7: 100, 14: 200 };
      const bonusXP = bonusMap[milestone] || 0;

      try {
        const xpRef = doc(firestore, "xp", authUser.uid);
        await updateDoc(xpRef, { total: increment(bonusXP) });
        const updated = totalXP + bonusXP;
        setTotalXP(updated);
        await AsyncStorage.setItem(XP_STORAGE_KEY, updated.toString());
      } catch {
        setXpError("Failed to apply streak bonus.");
      }
    },
    [authUser, totalXP]
  );

  const { level, currentXP, xpToNext, xpRequiredForLevel } = useMemo(
    () => calculateLevel(totalXP),
    [totalXP]
  );

  const value = useMemo(
    () => ({
      totalXP,
      currentXP,
      xpToNext,
      xpRequiredForLevel,
      level,
      addXP,
      resetXP,
      addPlanXP,
      applyWagerXP,
      applyStreakBonus,
      xpError,
    }),
    [
      totalXP,
      currentXP,
      xpToNext,
      xpRequiredForLevel,
      level,
      addXP,
      resetXP,
      addPlanXP,
      applyWagerXP,
      applyStreakBonus,
      xpError,
    ]
  );

  return <XPContext.Provider value={value}>{children}</XPContext.Provider>;
};

XPProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
