import { db } from "../firebase/init.js";
import { v4 as uuidv4 } from "uuid";
import analyzeChallengeForm from "../functions/analyzeChallengeForm.js";
import trackXP from "../functions/trackXP.js";
import { updateBattleStats } from "./battleStatsController.js";

// Create a new Workout Battle
export const createChallenge = async (req, res) => {
  const {
    exercise,
    wagerXP,
    opponents,
    rules,
    type = "reps",
    duration = 48,
    winnerTakesAll = true,
    gym = null,
  } = req.body;
  const userId = req.user?.uid;

  if (!userId || !exercise || !wagerXP || !Array.isArray(opponents)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const parsedWagerXP = parseInt(wagerXP, 10);
  if (isNaN(parsedWagerXP) || parsedWagerXP < 50 || parsedWagerXP > 500) {
    return res
      .status(400)
      .json({ error: "XP wager must be a number between 50 and 500." });
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists || (userSnap.data().xp || 0) < parsedWagerXP) {
      return res
        .status(400)
        .json({ error: "Creator does not have enough XP to make this wager." });
    }

    const id = uuidv4();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + duration * 60 * 60 * 1000);

    const challenge = {
      id,
      type,
      exercise,
      wagerXP: parsedWagerXP,
      xpPot: parsedWagerXP,
      creator: userId,
      participants: [userId],
      opponents: opponents.filter((opponentId) => opponentId !== userId),
      rules: rules || "",
      status: "pending",
      createdAt,
      expiresAt,
      results: {},
      votes: {},
      verified: false,
      flagged: false,
      winnerTakesAll,
      gym,
    };

    await db.collection("wagerChallenges").doc(id).set(challenge);

    await trackXP(userId, {
      amount: -parsedWagerXP,
      reason: "challenge_entry",
      challengeId: id,
    });

    res.status(201).json({ success: true, challenge });
  } catch (err) {
    console.error("Error creating challenge:", err);
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
    const docRef = db.collection("wagerChallenges").doc(challengeId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const challenge = snap.data();

    if (!challenge.opponents.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You are not an invited opponent for this challenge." });
    }

    if (challenge.participants.includes(userId)) {
      return res.status(400).json({ error: "Already joined this challenge." });
    }

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists || (userSnap.data().xp || 0) < challenge.wagerXP) {
      return res
        .status(400)
        .json({ error: "You do not have enough XP to accept this wager." });
    }

    const xpPot = (challenge.xpPot || 0) + challenge.wagerXP;

    await docRef.update({
      participants: admin.firestore.FieldValue.arrayUnion(userId),
      xpPot,
      status: "active",
    });

    await trackXP(userId, {
      amount: -challenge.wagerXP,
      reason: "challenge_entry",
      challengeId,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error accepting challenge:", err);
    res.status(500).json({ error: "Failed to accept challenge." });
  }
};

// Submit challenge result + optional AI verification
export const submitChallengeResult = async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user?.uid;
  const { videoUrl, notes, tier } = req.body;

  if (!userId || !videoUrl || !tier) {
    return res
      .status(400)
      .json({ error: "Missing required fields: userId, videoUrl, tier." });
  }

  try {
    const docRef = db.collection("wagerChallenges").doc(challengeId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const challenge = snap.data();

    if (!challenge.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You are not a participant in this challenge." });
    }

    if (
      challenge.status === "resolved" ||
      (challenge.expiresAt && new Date(challenge.expiresAt) < new Date())
    ) {
      return res
        .status(400)
        .json({ error: "Challenge is no longer active for submissions." });
    }

    const submission = {
      videoUrl,
      notes: notes || "",
      submittedAt: new Date(),
      verifiedByAI: false,
      feedback: null,
    };

    if (["Pro", "Elite"].includes(tier)) {
      const result = await analyzeChallengeForm(videoUrl);
      submission.verifiedByAI = result.success;
      submission.feedback = result.feedback || null;
    } else {
      submission.feedback = "AI analysis requires Pro or Elite tier.";
    }

    await docRef.update({
      [`results.${userId}`]: submission,
    });

    res.status(200).json({
      success: true,
      verifiedByAI: submission.verifiedByAI,
      feedback: submission.feedback,
    });
  } catch (err) {
    console.error("Error submitting challenge result:", err);
    res.status(500).json({ error: "Failed to submit result." });
  }
};

// Resolve challenge (via AI or scheduled job)
export const resolveChallengeOutcome = async (req, res) => {
  const { challengeId } = req.params;

  try {
    const docRef = db.collection("wagerChallenges").doc(challengeId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Challenge not found." });
    }

    const challenge = snap.data();

    if (challenge.status === "resolved") {
      return res.status(400).json({ error: "Challenge already resolved." });
    }
    if (challenge.expiresAt && new Date(challenge.expiresAt) > new Date()) {
      return res.status(400).json({ error: "Challenge has not expired yet." });
    }

    const participants = challenge.participants || [];
    let winnerId = null;
    let winningSubmission = null;

    const submittedParticipants = participants.filter(
      (uid) => challenge.results?.[uid]?.videoUrl,
    );

    if (submittedParticipants.length === 0) {
      await docRef.update({
        status: "no_winner",
        resolvedAt: new Date(),
      });
      return res.status(200).json({
        success: true,
        message: "No submissions, no winner declared.",
      });
    }

    for (const uid of submittedParticipants) {
      const entry = challenge.results[uid];
      if (entry.verifiedByAI) {
        winnerId = uid;
        winningSubmission = entry;
        break;
      }
    }

    if (winnerId) {
      await docRef.update({
        winnerId,
        status: "resolved",
        resolvedAt: new Date(),
        winningDetails: {
          submissionId: winnerId,
          feedback: winningSubmission?.feedback,
          verifiedByAI: winningSubmission?.verifiedByAI,
        },
      });

      for (const uid of participants) {
        if (uid === winnerId) {
          await updateBattleStats(uid, true);
          if (challenge.winnerTakesAll && challenge.xpPot) {
            await trackXP(winnerId, {
              amount: challenge.xpPot,
              reason: "challenge_win",
              challengeId,
            });
          }
        } else {
          await updateBattleStats(uid, false);
        }
      }
    } else {
      await docRef.update({
        status: "unresolved",
        resolvedAt: new Date(),
      });
      console.warn(
        `Challenge ${challengeId} could not find an AI-verified winner. Requires manual review or voting.`,
      );
    }

    res.status(200).json({ success: true, winnerId: winnerId || null });
  } catch (err) {
    console.error("Error resolving challenge outcome:", err);
    res.status(500).json({ error: "Failed to resolve challenge outcome." });
  }
};
