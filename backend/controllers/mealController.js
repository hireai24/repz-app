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

/**
 * Save a user's custom or AI-generated meal plan
 */
const saveMealPlan = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId, goal, calories, macros, preferences, meals } = req.body;

    if (!userId || !goal || typeof calories !== 'number' || !macros || !meals) {
      return res.status(400).json({ success: false, error: 'Missing or invalid meal plan data' });
    }

    try {
      const mealPlan = {
        userId,
        goal,
        calories,
        macros,
        preferences: preferences || '',
        meals,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'mealPlans'), mealPlan);
      res.status(200).json({ success: true, mealPlanId: docRef.id });
    } catch (err) {
      console.error('Error saving meal plan:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

/**
 * Get all meal plans for a user, newest first
 */
const getUserMealPlans = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Missing userId in request' });
    }

    try {
      const plansRef = collection(db, 'mealPlans');
      const q = query(
        plansRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ success: true, plans });
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

export { saveMealPlan, getUserMealPlans };
