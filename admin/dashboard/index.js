import express from 'express';
import reviewChallenges from './reviewChallenges.js';
import manageUsers from './manageUsers.js';
import highlightPlans from './highlightPlans.js';
import { verifyAdmin } from '../../backend/utils/authMiddleware.js';

const router = express.Router();

// Apply verifyAdmin middleware to all admin routes
router.use(verifyAdmin);

// Admin health check
router.get('/', (req, res) => {
  const uid = req.user?.uid || 'Unknown';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  console.log(`[ADMIN PING] UID: ${uid} | Agent: ${userAgent} | Timestamp: ${new Date().toISOString()}`);

  res.status(200).json({
    message: 'REPZ Admin Dashboard — Active',
    status: 'OK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount core admin routes
router.use('/review-challenges', reviewChallenges);
router.use('/manage-users', manageUsers);
router.use('/highlight-plans', highlightPlans);

export default router;
