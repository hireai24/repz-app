import express from 'express';
import { db } from '../../backend/firebase/init.js';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  where,
  query,
} from 'firebase/firestore';
import { verifyAdmin } from '../../backend/utils/authMiddleware.js';

const router = express.Router();

// GET /admin/dashboard/review-challenges/flagged
router.get('/flagged', verifyAdmin, async (req, res) => {
  try {
    const q = query(collection(db, 'challenges'), where('flagged', '==', true));
    const snapshot = await getDocs(q);

    const flagged = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // TODO: Add pagination + filters for larger datasets
    console.log(`[ADMIN] Retrieved ${flagged.length} flagged challenges.`);

    res.status(200).json({ success: true, flagged });
  } catch (err) {
    console.error('🔥 [reviewChallenges.js] Error fetching flagged challenges:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, error: 'Failed to fetch flagged challenges.' });
  }
});

// POST /admin/dashboard/review-challenges/moderate
router.post('/moderate', verifyAdmin, async (req, res) => {
  const { challengeId, action } = req.body;

  if (
    !challengeId || typeof challengeId !== 'string' || challengeId.trim() === '' ||
    !['approve', 'remove'].includes(action)
  ) {
    return res
      .status(400)
      .json({ success: false, error: 'Invalid or missing challengeId or action.' });
  }

  try {
    const docRef = doc(db, 'challenges', challengeId);

    if (action === 'remove') {
      await updateDoc(docRef, { removed: true, flagged: false });
    } else {
      await updateDoc(docRef, { flagged: false });
    }

    console.log(`[ADMIN] Challenge ${challengeId} ${action}d by ${req.user?.uid || 'unknown admin'}`);

    res.status(200).json({ success: true, message: `Challenge ${action}d successfully.` });
  } catch (err) {
    console.error('🔥 [reviewChallenges.js] Error moderating challenge:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, error: 'Failed to moderate challenge.' });
  }
});

export default router;
