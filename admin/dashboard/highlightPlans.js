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

// GET /admin/dashboard/highlight-plans/top
router.get('/top', verifyAdmin, async (req, res) => {
  try {
    const plansRef = collection(db, 'plans');
    const q = query(plansRef, where('isPublic', '==', true));
    const snapshot = await getDocs(q);

    const topPlans = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.sales >= 5 || p.rating >= 4.5)
      .sort((a, b) => (b.sales + b.rating) - (a.sales + a.rating))
      .slice(0, 10);

    console.log(`✅ Fetched ${topPlans.length} top plans`);

    res.status(200).json({ success: true, topPlans });
  } catch (err) {
    console.error('🔥 [highlightPlans.js] Error fetching top plans:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, error: 'Failed to fetch top plans.' });
  }
});

// POST /admin/dashboard/highlight-plans/feature
router.post('/feature', verifyAdmin, async (req, res) => {
  const { planId } = req.body;

  if (!planId || typeof planId !== 'string' || planId.trim() === '') {
    return res.status(400).json({ success: false, error: 'Invalid or missing planId.' });
  }

  try {
    const planRef = doc(db, 'plans', planId);
    await updateDoc(planRef, { featured: true });

    console.log(`⭐️ Plan ${planId} marked as featured`);

    res.status(200).json({ success: true, message: 'Plan featured successfully.' });
  } catch (err) {
    console.error('🔥 [highlightPlans.js] Error featuring plan:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, error: 'Failed to feature plan.' });
  }
});

export default router;
