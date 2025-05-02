import React, { createContext, useState, useEffect, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../backend/firebase/init';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null); // NEW: Capture auth errors

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await user.getIdToken();
          await AsyncStorage.setItem('authToken', token);
          setUserToken(token);
          setAuthUser(user);
        } else {
          await AsyncStorage.removeItem('authToken');
          setUserToken(null);
          setAuthUser(null);
        }
      } catch (err) {
        console.error('🔥 Auth state change error:', err);
        setUserToken(null);
        setAuthUser(null);
        setAuthError('Failed to process authentication state.'); // Set global error
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setAuthError(null); // Reset previous errors
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      await AsyncStorage.setItem('authToken', token);
      setUserToken(token);
      setAuthUser(result.user);
    } catch (err) {
      console.error('🔥 Sign-in failed:', err);
      setAuthError('Invalid credentials or network issue.');
      throw err;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem('authToken');
      setUserToken(null);
      setAuthUser(null);
    } catch (err) {
      console.error('🔥 Sign-out error:', err);
      setAuthError('Sign-out failed. Try again.');
    }
  };

  const value = useMemo(
    () => ({
      authUser,
      userToken,
      signIn,
      signOut,
      loading,
      authError, // NEW: Expose error globally
    }),
    [authUser, userToken, loading, authError]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
