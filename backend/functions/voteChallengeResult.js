// ✅ FINAL WORKING VERSION
import { db } from "../firebase/init.js";
import { doc, setDoc } from "firebase/firestore";

/**
 * Records a vote for a challenge winner.
 * @route POST /vote/:challengeId
 * @body { voterId, votedFor }
 */
export const submitVote = async (req, res) => {
  const { challengeId } = req.params;
  const { voterId, votedFor } = req.body;

  if (!challengeId || !voterId || !votedFor) {
    return res.status(400).json({ success: false, error: "Missing parameters." });
  }

  try {
    const voteRef = doc(db, "challengeVotes", `${challengeId}_${voterId}`);
    await setDoc(voteRef, {
      challengeId,
      voterId,
      votedFor,
      createdAt: new Date(),
    });

    return res.status(200).json({ success: true, message: "Vote submitted." });
  } catch (error) {
    console.error("🔥 Vote submission failed:", error.message);
    return res.status(500).json({ success: false, error: "Failed to submit vote." });
  }
};
