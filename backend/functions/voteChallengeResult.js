// backend/functions/voteChallengeResult.js
import { db } from "../firebase/init.js";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"; // Import updateDoc and arrayUnion

/**
 * Records a vote for a challenge winner.
 * This function should be accessible via an API route.
 * @route POST /api/wager/vote/:challengeId
 * @body {string} votedFor - The userId that the current voter is voting for.
 */
export const submitVote = async (req, res) => {
  const { challengeId } = req.params;
  const { votedFor } = req.body;
  const voterId = req.user?.uid; // CRITICAL: Get voterId from authenticated user

  if (!challengeId || !voterId || !votedFor) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required parameters: challengeId, votedFor." });
  }

  try {
    const challengeRef = doc(db, "wagerChallenges", challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (!challengeSnap.exists()) {
      return res.status(404).json({ success: false, error: "Challenge not found." });
    }

    const challenge = challengeSnap.data();

    // Prevent voting if challenge is resolved or not active for voting
    if (challenge.status === "resolved" || challenge.status === "no_winner") {
        return res.status(400).json({ success: false, error: "Cannot vote on a resolved or ended challenge." });
    }

    // Ensure the voter is a participant in the challenge
    if (!challenge.participants.includes(voterId)) {
        return res.status(403).json({ success: false, error: "You are not a participant in this challenge." });
    }

    // Ensure the user being voted for is a participant
    if (!challenge.participants.includes(votedFor)) {
        return res.status(400).json({ success: false, error: "Cannot vote for a non-participant." });
    }

    // Prevent a user from voting for themselves (unless explicit rule allows)
    if (voterId === votedFor) {
      return res.status(400).json({ success: false, error: "You cannot vote for yourself." });
    }

    // Store the vote
    // We can either store each vote as a separate document in `challengeVotes`
    // OR, more efficiently, update a `votes` map directly in the `wagerChallenges` document.
    // Let's modify to update the `wagerChallenges` document for simplicity and to make votes accessible with the challenge.
    // Assumes `challenge.votes` is a map like { 'votedForUserId': ['voterId1', 'voterId2'] }
    // Or just a count: { 'votedForUserId': count }

    // Option 1: Store individual votes within the challenge document (simpler for direct access)
    // This assumes `challenge.votes` is structured as { [votedForUserId]: count }
    await updateDoc(challengeRef, {
        [`votes.${votedFor}`]: increment(1), // Increment vote count for the chosen user
        [`voters.${voterId}`]: votedFor, // Record who the voter voted for, to prevent double voting
        // If you need to store *who* voted for whom explicitly, you might have:
        // `votesReceived: { [votedForUserId]: arrayUnion(voterId) }` and handle array updates.
    });

    // Option 2 (original intent with `challengeVotes` collection):
    // const voteDocId = `${challengeId}_${voterId}`;
    // const voteRef = doc(db, "challengeVotes", voteDocId);
    // await setDoc(voteRef, {
    //   challengeId,
    //   voterId,
    //   votedFor,
    //   createdAt: Timestamp.now(), // Use Timestamp for consistency
    // });


    return res.status(200).json({ success: true, message: "Vote submitted." });
  } catch (err) {
    console.error("Error submitting vote:", err); // Log the actual error
    return res
      .status(500)
      .json({ success: false, error: "Failed to submit vote." });
  }
};