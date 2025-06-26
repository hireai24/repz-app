import React, {createContext, useState, useEffect, useMemo, useContext} from "react";
import PropTypes from "prop-types";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { auth } from "../firebase/firebaseClient";
import { getUserProfile } from "../api/userApi"; // ✅ Added

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // ✅ New
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

          // ✅ Fetch user profile once signed in
          const profile = await getUserProfile();
          setUserProfile(profile);
        } else {
          await AsyncStorage.removeItem("authToken");
          setUserToken(null);
          setAuthUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        // Added error parameter for consistency
        setUserToken(null);
        setAuthUser(null);
        setUserProfile(null);
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

      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      // Added error parameter for consistency
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
      setUserProfile(null);
    } catch (error) {
      // Added error parameter for consistency
      setAuthError("Sign-out failed. Try again.");
    }
  };

  const isGymOwner = userProfile?.role === "gymOwner"; // ✅ New

  const value = useMemo(
    () => ({
      authUser,
      userToken,
      userId: authUser?.uid ?? null, // ✅ Normalized
      signIn,
      signOut,
      loading,
      authError,
      userProfile,
      isGymOwner,
    }),
    [authUser, userToken, userProfile, loading, authError, isGymOwner], // Added isGymOwner here
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
