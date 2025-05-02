import { db } from '../firebase/init.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { verifyUser } from '../utils/authMiddleware.js';

const ALLOWED_TIERS = ['Free', 'Pro', 'Elite'];

/**
 * Submit a lift to the leaderboard
 */
const submitLift = async (req, res) => {
  await verifyUser(req, res, async () => {
    const {
      exercise,
      weight,
      reps,
      gym,
      location,
      videoUrl,
      tier,
    } = req.body;

    const userId = req.user?.uid;

    if (
      !userId ||
      typeof exercise !== 'string' || !exercise.trim() ||
      typeof weight !== 'number' || weight <= 0 ||
      typeof reps !== 'number' || reps <= 0 ||
      typeof gym !== 'string' || !gym.trim() ||
      typeof videoUrl !== 'string' || !videoUrl.trim() ||
      typeof tier !== 'string' || !ALLOWED_TIERS.includes(tier)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid input fields.',
      });
    }

    const safeLocation =
      location &&
      typeof location.lat === 'number' &&
      typeof location.lng === 'number'
        ? location
        : null;

    try {
      const entry = {
        userId,
        exercise,
        weight,
        reps,
        gym,
        location: safeLocation,
        videoUrl,
        tier,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'leaderboard'), entry);

      res.status(200).json({ success: true, entryId: docRef.id });
    } catch (err) {
      console.error('🔥 Error submitting lift:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to submit lift to leaderboard.',
        details: err.message,
      });
    }
  });
};

/**
 * Get top lifts based on exercise and scope
 * Supported scopes: global, gym
 */
const getTopLifts = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { exercise, scope, gym } = req.query;

    if (!exercise || typeof exercise !== 'string' || !exercise.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid exercise parameter.',
      });
    }

    try {
      const lbRef = collection(db, 'leaderboard');
      let q = query(lbRef, where('exercise', '==', exercise), orderBy('weight', 'desc'));

      if (scope === 'gym' && typeof gym === 'string' && gym.trim()) {
        q = query(
          lbRef,
          where('exercise', '==', exercise),
          where('gym', '==', gym),
          orderBy('weight', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ success: true, results });
    } catch (err) {
      console.error('🔥 Error fetching leaderboard:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard data.',
        details: err.message,
      });
    }
  });
};

export { submitLift, getTopLifts };
