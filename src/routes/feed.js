const express = require('express');
const router = express.Router();
const {
  getProfiles,
  followUser,
  unfollowUser
} = require('../controllers/feedController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getProfiles);
router.post('/follow', authMiddleware, followUser);
router.delete('/unfollow/:userId', authMiddleware, unfollowUser);

module.exports = router;
