const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getSubscriptionStatus,
  createPaymentIntent,
  createCustomer,
  createSubscription,
  cancelSubscription,
  getPaymentMethods,
  webhookHandler
} = require('../controllers/subscriptionController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/follow', verifyToken, followUser);
router.post('/unfollow', verifyToken, unfollowUser);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);
router.get('/status/:targetUserId', verifyToken, getSubscriptionStatus);

router.post('/payment-intent', verifyToken, createPaymentIntent);
router.post('/customer', verifyToken, createCustomer);
router.post('/subscription', verifyToken, createSubscription);
router.patch('/subscription/:subscriptionId/cancel', verifyToken, cancelSubscription);
router.get('/payment-methods', verifyToken, getPaymentMethods);
router.post('/webhook', express.raw({type: 'application/json'}), webhookHandler);

module.exports = router;