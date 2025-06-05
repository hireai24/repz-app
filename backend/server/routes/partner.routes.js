// backend/server/routes/partner.routes.js

import express from "express";
import {
  createPartnerSlot,
  getPartnerSlots,
  joinPartnerSlot,
  leavePartnerSlot,
} from "../../controllers/partnerFinderController.js"; // ✅ Correct path

const router = express.Router();

/**
 * @route   POST /api/partner/create
 * @desc    Create a new training partner slot
 * @body    userId, username, gymId, gymName, timeSlot, (optional: note, avatar, tier)
 */
router.post("/create", createPartnerSlot);

/**
 * @route   GET /api/partner?gymId=...
 * @desc    Get all partner slots for a gym. gymId is a query parameter.
 */
router.get("/", getPartnerSlots); // ✅ Adjusted route to expect query parameter for getPartnerSlots

/**
 * @route   POST /api/partner/join/:slotId
 * @desc    Join a specific partner slot
 * @body    userId
 */
router.post("/join/:slotId", joinPartnerSlot);

/**
 * @route   POST /api/partner/leave/:slotId
 * @desc    Leave a specific partner slot
 * @body    userId
 */
router.post("/leave/:slotId", leavePartnerSlot);

export default router;
