import { db, admin } from "../firebase/init.js"; // include admin for FieldValue
// Removed firebase/firestore client SDK imports

/**
 * Create a new training partner slot
 */
export const createPartnerSlot = async (req, res) => {
  try {
    const { userId, username, gymId, gymName, timeSlot, note, avatar, tier } =
      req.body;

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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      participants: [userId],
      note: note || null,
      avatar: avatar || null,
      tier: tier || "Free",
    };

    const docRef = await db.collection("partnerSlots").add(slotData);

    return res.status(200).json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("Failed to create slot:", err);
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
    const { gymId } = req.query;
    if (!gymId) {
      return res.status(400).json({ success: false, error: "Missing gym ID." });
    }

    const querySnapshot = await db
      .collection("partnerSlots")
      .where("gymId", "==", gymId)
      .get();

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
    console.error("Failed to fetch slots:", err);
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

    const slotRef = db.collection("partnerSlots").doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists) {
      return res.status(404).json({ success: false, error: "Slot not found." });
    }

    const slotData = slotSnap.data();
    if (slotData.participants && slotData.participants.includes(userId)) {
      return res
        .status(409)
        .json({ success: false, error: "User already joined this slot." });
    }

    await slotRef.update({
      participants: admin.firestore.FieldValue.arrayUnion(userId),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to join slot:", err);
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

    const slotRef = db.collection("partnerSlots").doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists) {
      return res.status(404).json({ success: false, error: "Slot not found." });
    }

    const data = slotSnap.data();
    if (data.participants && !data.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: "User is not a participant of this slot.",
      });
    }

    const updatedParticipants = data.participants.filter((id) => id !== userId);

    if (updatedParticipants.length === 0) {
      await slotRef.delete();
    } else {
      await slotRef.update({
        participants: admin.firestore.FieldValue.arrayRemove(userId),
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to leave slot:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to leave slot." });
  }
};
