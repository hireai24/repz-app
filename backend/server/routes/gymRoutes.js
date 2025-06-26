// backend/server/routes/gymRoutes.js
import express from "express";
import {
  createGym,
  getGyms,
  getMyGym,
  updateGym,
  deleteGym,
  getGymsByOwner, // FIX: Import the new controller function
} from "../../controllers/gymController.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

// 🧾 Public or authenticated list of gyms
router.get("/", verifyUser, getGyms);

// 🙋‍♂️ Gym owner fetches their gym profile (singular)
router.get("/mine", verifyUser, getMyGym);

// FIX: Add route for fetching all gyms by a specific owner (used by MyGymsScreen)
router.get("/owner", verifyUser, getGymsByOwner); // Assuming it uses the authenticated user's UID

// ➕ Create gym
router.post("/", verifyUser, createGym);

// ✏️ Update gym info
router.patch("/:gymId", verifyUser, updateGym);

// ❌ Delete gym
router.delete("/:gymId", verifyUser, deleteGym);

export default router;
