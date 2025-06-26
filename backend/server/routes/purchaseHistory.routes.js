// backend/server/routes/purchaseHistory.routes.js

import express from "express";
import {
  getPurchaseHistory,
  logPurchase,
} from "../../controllers/purchaseHistoryController.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/purchases
 * Log a new purchase (for future extensibility).
 */
router.post("/", verifyUser, logPurchase);

/**
 * GET /api/purchases/:userId
 * Fetch purchase history for a user.
 */
router.get("/:userId", verifyUser, getPurchaseHistory);

export default router;
