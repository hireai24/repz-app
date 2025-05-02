import { db } from '../firebase/init.js';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { verifyUser, verifyAdmin } from '../utils/authMiddleware.js';

/**
 * Upload a custom workout/meal/bundle plan to Firestore
 */
const uploadPlan = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    const {
      title,
      description,
      type,
      durationWeeks,
      level,
      price,
      tags,
      schedule,
      mediaUrl,
      tier,
      isPublic,
    } = req.body;

    if (
      !title ||
      !description ||
      !type ||
      !durationWeeks ||
      !level ||
      typeof price !== 'number' ||
      !Array.isArray(tags) ||
      !schedule ||
      !tier
    ) {
      return res.status(400).json({ success: false, error: 'Invalid or missing input fields.' });
    }

    try {
      const planData = {
        userId: user.uid,
        title,
        description,
        type,
        durationWeeks,
        level,
        price,
        tags,
        schedule,
        mediaUrl: mediaUrl || '',
        tier,
        isPublic: !!isPublic,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'plans'), planData);
      res.status(200).json({ success: true, planId: docRef.id });
    } catch (err) {
      console.error('Error uploading plan:', err);
      res.status(500).json({ success: false, error: 'Failed to upload plan.' });
    }
  });
};

/**
 * Get all public marketplace plans
 */
const getMarketplacePlans = async (req, res) => {
  try {
    const plansRef = collection(db, 'plans');
    const q = query(plansRef, where('isPublic', '==', true), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, plans });
  } catch (err) {
    console.error('Error fetching marketplace plans:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch marketplace plans.' });
  }
};

/**
 * Get a single plan by ID
 */
const getPlanById = async (req, res) => {
  const { planId } = req.params;

  try {
    const docRef = doc(db, 'plans', planId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, error: 'Plan not found.' });
    }

    res.status(200).json({ success: true, plan: { id: snapshot.id, ...snapshot.data() } });
  } catch (err) {
    console.error('Error fetching plan:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch plan.' });
  }
};

/**
 * Update an existing plan with ownership validation
 */
const updatePlan = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    const { planId } = req.params;
    const updates = req.body;

    if (!planId || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ success: false, error: 'Invalid update input.' });
    }

    try {
      const docRef = doc(db, 'plans', planId);
      const planSnap = await getDoc(docRef);

      if (!planSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Plan not found.' });
      }

      const planData = planSnap.data();
      if (planData.userId !== user.uid && user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Unauthorized to edit this plan.' });
      }

      await updateDoc(docRef, updates);

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error updating plan:', err);
      res.status(500).json({ success: false, error: 'Failed to update plan.' });
    }
  });
};

/**
 * Delete a plan (admin only)
 */
const deletePlan = async (req, res) => {
  await verifyAdmin(req, res, async () => {
    const { planId } = req.params;

    if (!planId) {
      return res.status(400).json({ success: false, error: 'Missing planId.' });
    }

    try {
      const docRef = doc(db, 'plans', planId);
      const planSnap = await getDoc(docRef);

      if (!planSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Plan not found.' });
      }

      await deleteDoc(docRef);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error deleting plan:', err);
      res.status(500).json({ success: false, error: 'Failed to delete plan.' });
    }
  });
};

export {
  uploadPlan,
  getMarketplacePlans,
  getPlanById,
  updatePlan,
  deletePlan,
};
