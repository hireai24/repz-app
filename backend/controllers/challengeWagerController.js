import { db } from "../firebase/init.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
  arrayUnion,
  increment,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import analyzeChallengeForm from "../functions/analyzeChallengeForm.js";
import trackXP from "../functions/trackXP.js";

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
    gym = null,
  } = req.body;
  const userId = req.user?.uid;

  if (!userId || !exercise || !wagerXP || !Array.isArray(opponents)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const id = uuidv4();
    const createdAt = Timestamp.now();
    const expiresAt = Timestamp.fromDate(new Date(createdAt.toDate().getTime() + duration * 60 * 60 * 1000));

    const challenge = {
      id,
      type,
      exercise,
      wagerXP,
      xpPot: wagerXP,
      creator: userId,
      participants: [userId],
      opponents,
      rules: rules || "",
      status: "active",
      createdAt,
      expiresAt,
      results: {},
      votes: {},
      verified: false,
      flagged: false,
      winnerTakesAll,
      gym,
    };

    await setDoc(doc(db, "wagerChallenges", id), challenge);

    // Deduct XP from creator
    await trackXP(userId, {
      amount: -wagerXP,
      reason: "challenge_entry",
      challengeId: id,
    });

    res.status(200).json({ success: true, challenge });
  } catch (err) {
    console.error("createChallenge error:", err);
    res.status(500).json({ error: "Failed to create challenge." });
  }
};

// Accept challenge and pay entry
export const acceptChallenge = async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user?.uid;

  try {
    const docRef = doc(db, "wagerChallenges", challengeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return res.status(404).json({ error: "Challenge not found." });

    const challenge = snap.data();
    if (challenge.participants.includes(userId)) {
      return res.status(400).json({ error: "Already joined." });
    }

    await updateDoc(docRef, {
      participants: arrayUnion(userId),
      xpPot: increment(challenge.wagerXP),
    });

    await trackXP(userId, {
      amount: -challenge.wagerXP,
      reason: "challenge_entry",
      challengeId,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("acceptChallenge error:", err);
    res.status(500).json({ error: "Failed to accept challenge." });
  }
};

// Submit challenge result + optional AI verification
export const submitChallengeResult = async (req, res) => {
  const { challengeId } = req.params;
  const userId = req.user?.uid;
  const { videoUrl, notes, tier } = req.body;

  if (!videoUrl || !tier) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const docRef = doc(db, "wagerChallenges", challengeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return res.status(404).json({ error: "Challenge not found." });

    const submission = {
      videoUrl,
      notes: notes || "",
      submittedAt: Timestamp.now(),
      verifiedByAI: false,
      feedback: null,
    };

    if (["Pro", "Elite"].includes(tier)) {
      const result = await analyzeChallengeForm(videoUrl);
      submission.verifiedByAI = result.success;
      submission.feedback = result.feedback || null;
    }

    await updateDoc(docRef, {
      [`results.${userId}`]: submission,
    });

    res.status(200).json({ success: true, verifiedByAI: submission.verifiedByAI });
  } catch (err) {
    console.error("submitChallengeResult error:", err);
    res.status(500).json({ error: "Failed to submit result." });
  }
};

// Resolve challenge (via AI or scheduled job)
export const resolveChallengeOutcome = async (req, res) => {
  const { challengeId } = req.params;

  try {
    const docRef = doc(db, "wagerChallenges", challengeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return res.status(404).json({ error: "Challenge not found." });

    const challenge = snap.data();
    const participants = challenge.participants || [];

    let winnerId = null;
    for (const uid of participants) {
      const entry = challenge.results?.[uid];
      if (entry?.videoUrl && entry?.verifiedByAI) {
        winnerId = uid;
        break;
      }
    }

    await updateDoc(docRef, {
      winnerId,
      status: "resolved",
      resolvedAt: Timestamp.now(),
    });

    // Track win/loss and bonus XP
    if (winnerId) {
      await updateDoc(doc(db, "battleStats", winnerId), {
        wins: increment(1),
        currentStreak: increment(1),
      });

      for (const uid of participants) {
        if (uid !== winnerId) {
          await updateDoc(doc(db, "battleStats", uid), {
            losses: increment(1),
            currentStreak: 0,
          });
        }
      }

      if (challenge.winnerTakesAll && challenge.xpPot) {
        await trackXP(winnerId, {
          amount: challenge.xpPot,
          reason: "challenge_win",
          challengeId,
        });
      }
    }

    res.status(200).json({ success: true, winnerId });
  } catch (err) {
    console.error("resolveChallengeOutcome error:", err);
    res.status(500).json({ error: "Failed to resolve challenge." });
  }
};
