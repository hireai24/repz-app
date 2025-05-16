import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { db } from "../../backend/firebase/init.js"; // ✅ FIXED PATH & EXTENSION

/**
 * Fetch all available challenges from Firestore.
 * @returns {Promise<Array>} Array of challenge objects.
 */
export const getChallenges = async () => {
  try {
    const snapshot = await getDocs(collection(db, "challenges"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Failed to fetch challenges:", error);
    throw new Error("Could not load challenges.");
  }
};

/**
 * Submits user entry into a challenge.
 * @param {string} challengeId - Firestore ID of the challenge
 * @returns {Promise<Object>} - { success: true }
 */
export const submitChallenge = async (challengeId) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) throw new Error("Missing auth token");

    const userId = await AsyncStorage.getItem("userId");
    if (!userId) throw new Error("Missing user ID");

    const challengeRef = doc(db, "challenges", challengeId);
    await updateDoc(challengeRef, {
      participants: arrayUnion(userId),
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Failed to submit challenge entry:", error);
    throw new Error("Challenge entry failed.");
  }
};
