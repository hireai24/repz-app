// backend/controllers/challengeWagerController.js
import { db } from "../firebase/init.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import analyzeChallengeForm from "../functions/analyzeChallengeForm.js"; // Assuming this is for AI analysis
import trackXP from "../functions/trackXP.js";
import { updateBattleStats } from "./battleStatsController.js"; // Import updateBattleStats

// Create a new Workout Battle
export const createChallenge = async (req, res) => {
  const {
    exercise,
    wagerXP,
    opponents,
    rules,
    type = "reps",
    duration = 48, // hours
    winnerTakesAll = true,
    gym = null, // Renamed from 'gym' to 'gymId' for clarity if it's an ID
  } = req.body;
  const userId = req.user?.uid;

  if (!userId || !exercise || !wagerXP || !Array.isArray(opponents)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  // Ensure wagerXP is a number and within valid range on backend too
  const parsedWagerXP = parseInt(wagerXP, 10);
  if (isNaN(parsedWagerXP) || parsedWagerXP < 50 || parsedWagerXP > 500) {
    return res.status(400).json({ error: "XP wager must be a number between 50 and 500." });
  }

  try {
    // Check if the creator has enough XP (redundant with frontend but good backend validation)
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || (userSnap.data().xp || 0) < parsedWagerXP) {
      return res.status(400).json({ error: "Creator does not have enough XP to make this wager." });
    }


    const id = uuidv4();
    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromDate(
      new Date(createdAt.toDate().getTime() + duration * 60 * 60 * 1000),
    );

    const challenge = {
      id,
      type,
      exercise,
      wagerXP: parsedWagerXP, // Store as number
      xpPot: parsedWagerXP, // Initial pot
      creator: userId,
      participants: [userId], // Creator is automatically a participant
      opponents: opponents.filter(opponentId => opponentId !== userId), // Ensure creator is not in opponents list
      rules: rules || "",
      status: "pending", // Set to pending, then active once accepted by at least one opponent
      createdAt,
      expiresAt,
      results: {}, // Stores submission results keyed by userId
      votes: {}, // Stores votes keyed by voterId
      verified: false, // General verification status for the challenge outcome
      flagged: false, // For manual review
      winnerTakesAll,
      gym, // Use 'gym' if it's the intended field name for gym ID/name
    };

    await setDoc(doc(db, "wagerChallenges", id), challenge);

    // Deduct XP from creator
    await trackXP(userId, {
      amount: -parsedWagerXP,
      reason: "challenge_entry",
      challengeId: id,
    });

    res.status(201).json({ success: true, challenge }); // 201 Created
  } catch (err) {
    console.error("Error creating challenge:", err); // Log error
    res.status(500).json({ error: "Failed to create challenge." });
  }
};

// Accept challenge and pay entry
export const acceptChallenge = async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user?.uid;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const docRef = doc(db, "wagerChallenges", challengeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const challenge = snap.data();

    if (!challenge.opponents.includes(userId)) {
      return res.status(403).json({ error: "You are not an invited opponent for this challenge." });
    }

    if (challenge.participants.includes(userId)) {
      return res.status(400).json({ error: "Already joined this challenge." });
    }

    // Check if user has enough XP to accept
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || (userSnap.data().xp || 0) < challenge.wagerXP) {
      return res.status(400).json({ error: "You do not have enough XP to accept this wager." });
    }

    await updateDoc(docRef, {
      participants: arrayUnion(userId),
      xpPot: increment(challenge.wagerXP),
      status: "active", // Challenge becomes active once an opponent accepts
    });

    await trackXP(userId, {
      amount: -challenge.wagerXP,
      reason: "challenge_entry",
      challengeId,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error accepting challenge:", err); // Log error
    res.status(500).json({ error: "Failed to accept challenge." });
  }
};

// Submit challenge result + optional AI verification
export const submitChallengeResult = async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user?.uid;
  const { videoUrl, notes, tier } = req.body; // tier is user's tier

  if (!userId || !videoUrl || !tier) {
    return res.status(400).json({ error: "Missing required fields: userId, videoUrl, tier." });
  }

  try {
    const docRef = doc(db, "wagerChallenges", challengeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const challenge = snap.data();

    if (!challenge.participants.includes(userId)) {
      return res.status(403).json({ error: "You are not a participant in this challenge." });
    }

    // Prevent submitting if challenge is already resolved or expired
    if (challenge.status === "resolved" || (challenge.expiresAt && challenge.expiresAt.toDate() < new Date())) {
      return res.status(400).json({ error: "Challenge is no longer active for submissions." });
    }

    const submission = {
      videoUrl,
      notes: notes || "",
      submittedAt: Timestamp.now(),
      verifiedByAI: false, // Default to false
      feedback: null,
    };

    // Only attempt AI verification if user's tier is Pro or Elite
    if (["Pro", "Elite"].includes(tier)) {
      console.log(`Attempting AI analysis for user ${userId} with tier ${tier}`);
      const result = await analyzeChallengeForm(videoUrl); // This function needs to return { success: bool, feedback: string }
      submission.verifiedByAI = result.success;
      submission.feedback = result.feedback || null;
    } else {
      console.log(`AI analysis skipped for user ${userId} (tier: ${tier}).`);
      submission.feedback = "AI analysis requires Pro or Elite tier.";
    }

    await updateDoc(docRef, {
      [`results.${userId}`]: submission,
    });

    res
      .status(200)
      .json({ success: true, verifiedByAI: submission.verifiedByAI, feedback: submission.feedback });
  } catch (err) {
    console.error("Error submitting challenge result:", err); // Log error
    res.status(500).json({ error: "Failed to submit result." });
  }
};

// Resolve challenge (via AI or scheduled job)
// This function should ideally be triggered by a scheduled job or an admin action,
// not directly by a user API call, as it determines winners and distributes XP.
export const resolveChallengeOutcome = async (req, res) => {
  const { challengeId } = req.params;
  // Potentially add admin role check here if this route is to be called manually
  // const userId = req.user?.uid;
  // if (!isAdmin(userId)) return res.status(403).json({ error: "Forbidden" });

  try {
    const docRef = doc(db, "wagerChallenges", challengeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const challenge = snap.data();

    // Prevent re-resolving or resolving before expiry
    if (challenge.status === "resolved") {
      return res.status(400).json({ error: "Challenge already resolved." });
    }
    if (challenge.expiresAt && challenge.expiresAt.toDate() > new Date()) {
        return res.status(400).json({ error: "Challenge has not expired yet." });
    }

    const participants = challenge.participants || [];
    let winnerId = null;
    let winningScore = null; // Can be used for "highest reps" or "lowest time"
    let winningSubmission = null;

    // Determine winner based on challenge type and AI verification
    // This logic assumes `analyzeChallengeForm` returns a `score` or similar metric.
    // The current `analyzeChallengeForm` description suggests it returns `success` and `feedback`.
    // You might need to update `analyzeChallengeForm` to provide a quantifiable score
    // if challenge types like "Max Reps" or "Heaviest Lift" are to be resolved via AI.

    // For now, let's assume `verifiedByAI: true` is the primary winning condition
    // and if multiple, the one with 'better' implicit score or first verified wins.
    // For a more robust solution:
    //  - `analyzeChallengeForm` should return a numerical score (e.g., reps, weight, form score).
    //  - The winner selection logic here would compare scores.

    const submittedParticipants = participants.filter(uid => challenge.results?.[uid]?.videoUrl);

    if (submittedParticipants.length === 0) {
        // No submissions, no winner. Potentially refund XP or mark as draw.
        await updateDoc(docRef, {
            status: "no_winner",
            resolvedAt: Timestamp.now(),
        });
        return res.status(200).json({ success: true, message: "No submissions, no winner declared." });
    }

    // Simple winner logic: first AI-verified submission, or handle based on challenge type
    // This example still prioritizes AI-verified first.
    // If you need more complex scoring, you'd iterate and compare scores.
    for (const uid of submittedParticipants) {
        const entry = challenge.results[uid];
        if (entry.verifiedByAI) {
            winnerId = uid;
            winningSubmission = entry; // Keep track of the winning submission
            break; // Found an AI-verified winner, for now take the first one
        }
    }

    if (winnerId) {
        await updateDoc(docRef, {
            winnerId,
            status: "resolved",
            resolvedAt: Timestamp.now(),
            winningDetails: { // Add winning details for clarity
                submissionId: winnerId, // Or unique ID for the submission
                feedback: winningSubmission?.feedback,
                verifiedByAI: winningSubmission?.verifiedByAI,
                // Add score here if analyzeChallengeForm provides it
            }
        });

        // Update battle stats for all participants
        for (const uid of participants) {
            if (uid === winnerId) {
                await updateBattleStats(uid, true); // Call the imported function for winner
                // Distribute XP pot
                if (challenge.winnerTakesAll && challenge.xpPot) {
                    await trackXP(winnerId, {
                        amount: challenge.xpPot,
                        reason: "challenge_win",
                        challengeId,
                    });
                }
            } else {
                await updateBattleStats(uid, false); // Call the imported function for losers
            }
        }
    } else {
        // If no AI-verified winner, maybe it goes to community vote, or is flagged
        // For now, mark as "unresolved" or "flagged" for manual review
        await updateDoc(docRef, {
            status: "unresolved", // Or "pending_vote_review"
            resolvedAt: Timestamp.now(), // Still mark as resolved for the system, but status indicates it needs human
        });
        console.warn(`Challenge ${challengeId} could not find an AI-verified winner. Requires manual review or voting.`);
    }


    res.status(200).json({ success: true, winnerId: winnerId || null });
  } catch (err) {
    console.error("Error resolving challenge outcome:", err); // Log error
    res.status(500).json({ error: "Failed to resolve challenge outcome." });
  }
};