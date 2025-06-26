import { db } from "../firebase/init.js";
import { FieldValue } from "firebase-admin/firestore"; // ✅ for increment

/**
 * Records a vote for a challenge winner.
 * @route POST /api/wager/vote/:challengeId
 * @body {string} votedFor - The userId that the current voter is voting for.
 */
export const submitVote = async (req, res) => {
  const { challengeId } = req.params;
  const { votedFor } = req.body;
  const voterId = req.user?.uid;

  if (!challengeId || !voterId || !votedFor) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameters: challengeId, votedFor.",
    });
  }

  try {
    const challengeRef = db.collection("wagerChallenges").doc(challengeId);
    const challengeSnap = await challengeRef.get();

    if (!challengeSnap.exists) {
      return res
        .status(404)
        .json({ success: false, error: "Challenge not found." });
    }

    const challenge = challengeSnap.data();

    if (challenge.status === "resolved" || challenge.status === "no_winner") {
      return res.status(400).json({
        success: false,
        error: "Cannot vote on a resolved or ended challenge.",
      });
    }

    if (!challenge.participants.includes(voterId)) {
      return res.status(403).json({
        success: false,
        error: "You are not a participant in this challenge.",
      });
    }

    if (!challenge.participants.includes(votedFor)) {
      return res.status(400).json({
        success: false,
        error: "Cannot vote for a non-participant.",
      });
    }

    if (voterId === votedFor) {
      return res.status(400).json({
        success: false,
        error: "You cannot vote for yourself.",
      });
    }

    await challengeRef.update({
      [`votes.${votedFor}`]: FieldValue.increment(1),
      [`voters.${voterId}`]: votedFor,
    });

    return res.status(200).json({ success: true, message: "Vote submitted." });
  } catch (err) {
    console.error("Error submitting vote:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to submit vote." });
  }
};
