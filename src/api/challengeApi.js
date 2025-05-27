import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../firebase/firebaseClient"; // ✅ CORRECT PATH

/**
 * Fetch all standard challenges from Firestore.
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
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to fetch challenges:", error);
    }
    throw new Error("Could not load challenges.");
  }
};

/**
 * Submits user entry into a standard challenge.
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
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to submit challenge entry:", error);
    }
    throw new Error("Challenge entry failed.");
  }
};

/**
 * Fetch an XP wager battle challenge with enhanced fields.
 * @param {string} id - Firestore ID of the wager challenge
 * @returns {Promise<Object>} - Full challenge object
 */
export const getWagerChallenge = async (id) => {
  try {
    const snap = await getDoc(doc(db, "wagerChallenges", id));
    if (!snap.exists()) throw new Error("Challenge not found");
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to fetch wager challenge:", error);
    }
    throw new Error("Could not load wager challenge.");
  }
};

/**
 * Fetch all wager challenges (Workout Battles).
 * @returns {Promise<Array>} Array of enhanced challenge objects.
 */
export const getWagerChallenges = async () => {
  try {
    const snapshot = await getDocs(collection(db, "wagerChallenges"));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to fetch wager challenges:", error);
    }
    throw new Error("Could not load wager challenges.");
  }
};
