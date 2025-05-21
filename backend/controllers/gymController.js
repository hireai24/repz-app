// backend/controllers/gymController.js 
import { db } from "../firebase/init.js"; // ✅ FIXED: Added .js extension
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

/**
 * Create a new gym profile.
 */
export const createGym = async (req, res) => {
  try {
    const gymData = {
      name: req.body.name,
      location: req.body.location,
      description: req.body.description,
      image: req.body.image || "",
      createdAt: Timestamp.now(),
      createdBy: req.body.userId,
    };
    const ref = await addDoc(collection(db, "gyms"), gymData);
    res.status(200).json({ success: true, id: ref.id });
  } catch (err) {
    console.error("Create gym error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Fetch all gyms or gyms by filter.
 */
export const getGyms = async (req, res) => {
  try {
    const snapshot = await getDocs(collection(db, "gyms"));
    const gyms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, gyms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Update gym info.
 */
export const updateGym = async (req, res) => {
  try {
    const ref = doc(db, "gyms", req.params.gymId);
    await updateDoc(ref, req.body);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Delete a gym.
 */
export const deleteGym = async (req, res) => {
  try {
    const ref = doc(db, "gyms", req.params.gymId);
    await deleteDoc(ref);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
