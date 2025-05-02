import { db } from '../firebase/init.js';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { verifyUser } from '../utils/authMiddleware.js';

/**
 * Save a new user-owned plan (AI-generated, purchased, or uploaded).
 * Fields: userId (server-attached), name, type, exercises, createdAt
 */
const saveUserPlan = async (req, res) => {
  const { name, type, exercises, createdAt } = req.body;
  const userId = req.user?.uid; // Always trust server-authenticated userId

  if (
    !userId || typeof userId !== 'string' ||
    !name || typeof name !== 'string' ||
    !type || typeof type !== 'string' ||
    !Array.isArray(exercises)
  ) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid fields: userId, name, type, and exercises are required.'
    });
  }

  try {
    const docRef = await addDoc(collection(db, 'userPlans'), {
      userId,
      name,
      type,
      exercises,
      createdAt: createdAt ? new Date(createdAt) : Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      planId: docRef.id,
    });
  } catch (err) {
    console.error('🔥 Error saving user plan:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Unknown error saving user plan.',
    });
  }
};

// Export with verifyUser middleware
export default [verifyUser, saveUserPlan];
