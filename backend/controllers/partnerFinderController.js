// backend/controllers/partnerFinderController.js

import { db } from "../firebase/init.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";

/**
 * Create a new training partner slot
 */
export const createPartnerSlot = async (req, res) => {
  try {
    const { userId, username, gymId, gymName, timeSlot } = req.body;

    if (!userId || !gymId || !timeSlot) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields." });
    }

    const slotData = {
      userId,
      username: username || "REPZ User",
      gymId,
      gymName: gymName || "",
      timeSlot,
      createdAt: serverTimestamp(),
      participants: [userId], // creator is auto-added
    };

    const docRef = await addDoc(collection(db, "partnerSlots"), slotData);

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to create slot." });
  }
};

/**
 * Get all open partner training slots for a gym
 */
export const getPartnerSlots = async (req, res) => {
  try {
    const { gymId } = req.params;
    if (!gymId)
      return res.status(400).json({ success: false, error: "Missing gym ID." });

    const q = query(
      collection(db, "partnerSlots"),
      where("gymId", "==", gymId),
    );

    const querySnapshot = await getDocs(q);
    const slots = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      slots.push({
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || null,
      });
    });

    return res.status(200).json({ success: true, data: slots });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch slots." });
  }
};

/**
 * Join an open partner slot
 */
export const joinPartnerSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { userId } = req.body;

    if (!slotId || !userId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing parameters." });
    }

    const slotRef = doc(db, "partnerSlots", slotId);
    const slotSnap = await getDoc(slotRef);
    if (!slotSnap.exists()) {
      return res.status(404).json({ success: false, error: "Slot not found." });
    }

    await updateDoc(slotRef, {
      participants: arrayUnion(userId),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to join slot." });
  }
};

/**
 * Leave a partner slot
 */
export const leavePartnerSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { userId } = req.body;

    if (!slotId || !userId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing parameters." });
    }

    const slotRef = doc(db, "partnerSlots", slotId);
    const slotSnap = await getDoc(slotRef);
    if (!slotSnap.exists()) {
      return res.status(404).json({ success: false, error: "Slot not found." });
    }

    const data = slotSnap.data();
    const updatedParticipants = data.participants.filter((id) => id !== userId);

    if (updatedParticipants.length === 0) {
      await deleteDoc(slotRef); // auto-delete if empty
    } else {
      await updateDoc(slotRef, {
        participants: arrayRemove(userId),
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to leave slot." });
  }
};
