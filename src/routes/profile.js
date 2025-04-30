const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  createProfile,
  updateProfile,
  deleteProfile
} = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getMyProfile);
router.post('/', authMiddleware, createProfile);
router.put('/', authMiddleware, updateProfile);
router.delete('/', authMiddleware, deleteProfile);

module.exports = router;
