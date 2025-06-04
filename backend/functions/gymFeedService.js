// backend/functions/gymFeedService.js
import admin from "firebase-admin"; // FIX: Changed to ES Module import
const db = admin.firestore();

export const getPostsByGym = async (gymId) => {
  const snapshot = await db
    .collection("gymFeed")
    .where("gymId", "==", gymId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const createPost = async (ownerId, { gymId, imageUrl, text, offer }) => {
  const ref = db.collection("gymFeed").doc();
  const post = {
    gymId,
    ownerId,
    imageUrl: imageUrl || null,
    text: text || "",
    offer: offer || null,
    // FIX: Use serverTimestamp for consistency and reliability
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(post);
  return { id: ref.id, ...post };
};

export const deletePost = async (postId, ownerId) => {
  const ref = db.collection("gymFeed").doc(postId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Post not found.");
  // Check if the ownerId matches before deleting to prevent unauthorized deletion
  if (doc.data().ownerId !== ownerId) throw new Error("Not authorized.");
  await ref.delete();
};