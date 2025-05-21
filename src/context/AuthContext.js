// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useMemo } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../firebase/firebaseClient"; // ✅ fixed import path

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await user.getIdToken();
          await AsyncStorage.setItem("authToken", token);
          setUserToken(token);
          setAuthUser(user);
        } else {
          await AsyncStorage.removeItem("authToken");
          setUserToken(null);
          setAuthUser(null);
        }
      } catch {
        setUserToken(null);
        setAuthUser(null);
        setAuthError("Failed to process authentication state.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setAuthError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      await AsyncStorage.setItem("authToken", token);
      setUserToken(token);
      setAuthUser(result.user);
    } catch {
      setAuthError("Invalid credentials or network issue.");
      throw new Error("Sign-in failed");
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem("authToken");
      setUserToken(null);
      setAuthUser(null);
    } catch {
      setAuthError("Sign-out failed. Try again.");
    }
  };

  const value = useMemo(
    () => ({
      authUser,
      userToken,
      signIn,
      signOut,
      loading,
      authError,
    }),
    [authUser, userToken, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
