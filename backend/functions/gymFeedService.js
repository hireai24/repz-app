// backend/functions/gymFeedService.js
import admin from "firebase-admin";

// Ensure Firestore is initialized once per process (best practice for Firebase Functions)
const db = admin.firestore();

/**
 * Get all gym feed posts for a specific gym, sorted by most recent.
 * @param {string} gymId
 * @returns {Promise<Array>}
 */
export const getPostsByGym = async (gymId) => {
  const snapshot = await db
    .collection("gymFeed")
    .where("gymId", "==", gymId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Create a new post in the gym feed.
 * @param {string} ownerId
 * @param {{ gymId: string, imageUrl?: string, text?: string, offer?: string }} param1
 * @returns {Promise<Object>}
 */
export const createPost = async (ownerId, { gymId, imageUrl, text, offer }) => {
  const ref = db.collection("gymFeed").doc();
  const post = {
    gymId,
    ownerId,
    imageUrl: imageUrl || null,
    text: text || "",
    offer: offer || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(post);
  return { id: ref.id, ...post };
};

/**
 * Delete a post from the gym feed, only if the owner matches.
 * @param {string} postId
 * @param {string} ownerId
 * @returns {Promise<void>}
 */
export const deletePost = async (postId, ownerId) => {
  const ref = db.collection("gymFeed").doc(postId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Post not found.");
  if (doc.data().ownerId !== ownerId) throw new Error("Not authorized.");
  await ref.delete();
};
