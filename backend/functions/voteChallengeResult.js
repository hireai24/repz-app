import { db } from "../firebase/init.js";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"; // Import increment!

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
    const challengeRef = doc(db, "wagerChallenges", challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (!challengeSnap.exists()) {
      return res
        .status(404)
        .json({ success: false, error: "Challenge not found." });
    }

    const challenge = challengeSnap.data();

    // Prevent voting if challenge is resolved or not active for voting
    if (challenge.status === "resolved" || challenge.status === "no_winner") {
      return res.status(400).json({
        success: false,
        error: "Cannot vote on a resolved or ended challenge.",
      });
    }

    // Ensure the voter is a participant in the challenge
    if (!challenge.participants.includes(voterId)) {
      return res.status(403).json({
        success: false,
        error: "You are not a participant in this challenge.",
      });
    }

    // Ensure the user being voted for is a participant
    if (!challenge.participants.includes(votedFor)) {
      return res
        .status(400)
        .json({ success: false, error: "Cannot vote for a non-participant." });
    }

    // Prevent voting for self
    if (voterId === votedFor) {
      return res
        .status(400)
        .json({ success: false, error: "You cannot vote for yourself." });
    }

    // Store the vote atomically
    await updateDoc(challengeRef, {
      [`votes.${votedFor}`]: increment(1),
      [`voters.${voterId}`]: votedFor,
    });

    return res.status(200).json({ success: true, message: "Vote submitted." });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error submitting vote:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to submit vote." });
  }
};
