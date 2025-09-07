const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSubscriptionStatus
} = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/follow', verifyToken, followUser);
router.post('/unfollow', verifyToken, unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);
router.get('/status/:targetUserId', verifyToken, getSubscriptionStatus);

module.exports = router;