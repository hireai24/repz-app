import express from "express";
import {
  createGym,
  getGyms,
  updateGym,
  deleteGym,
} from "../../controllers/gymController.js";
import { verifyUser } from "../../utils/authMiddleware.js"; // ✅ Fixed path

const router = express.Router();

router.get("/", verifyUser, getGyms);
router.post("/", verifyUser, createGym);
router.patch("/:gymId", verifyUser, updateGym);
router.delete("/:gymId", verifyUser, deleteGym);

export default router;
