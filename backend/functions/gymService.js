// backend/functions/gymService.js
import admin from "firebase-admin";

const db = admin.firestore();

/**
 * Creates a new gym profile.
 * @param {Object} gymData - Gym details.
 * @returns {Promise<{success: boolean, id: string}>}
 */
export const createGym = async (gymData) => {
  const docRef = await db.collection("gyms").add({
    ...gymData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true, id: docRef.id };
};

/**
 * Updates a gym profile.
 * @param {string} gymId - Gym document ID.
 * @param {Object} updates - Updated fields.
 * @returns {Promise<{success: boolean}>}
 */
export const updateGym = async (gymId, updates) => {
  await db
    .collection("gyms")
    .doc(gymId)
    .update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  return { success: true };
};

/**
 * Deletes a gym.
 * @param {string} gymId - Gym document ID.
 * @returns {Promise<{success: boolean}>}
 */
export const deleteGym = async (gymId) => {
  await db.collection("gyms").doc(gymId).delete();
  return { success: true };
};

/**
 * Gets all gyms (optionally paginated or filtered in future).
 * @returns {Promise<{success: boolean, gyms: Array}>}
 */
export const getAllGyms = async () => {
  const snapshot = await db
    .collection("gyms")
    .orderBy("createdAt", "desc")
    .get();
  const gyms = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return { success: true, gyms };
};

/**
 * Gets gyms by owner UID.
 * @param {string} ownerId
 * @returns {Promise<{success: boolean, gyms: Array}>}
 */
export const getGymsByOwner = async (ownerId) => {
  const snapshot = await db
    .collection("gyms")
    .where("ownerId", "==", ownerId)
    .orderBy("createdAt", "desc")
    .get();
  const gyms = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return { success: true, gyms };
};
