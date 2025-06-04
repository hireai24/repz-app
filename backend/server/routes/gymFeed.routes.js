// backend/server/routes/gymFeed.routes.js
import express from "express"; // FIX: Changed to ES Module import
const router = express.Router();
import * as gymFeedController from "../../controllers/gymFeedController.js"; // FIX: Changed to ES Module import
import { verifyUser } from "../../utils/authMiddleware.js"; // FIX: Changed to ES Module import

router.get("/:gymId", gymFeedController.getFeedForGym);
router.post("/", verifyUser, gymFeedController.createFeedPost);
router.delete("/:postId", verifyUser, gymFeedController.deleteFeedPost);

export default router; // FIX: Changed to ES Module export