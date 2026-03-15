const router = require('express').Router();
const College = require('../models/College');

// @route   GET /api/colleges
// @desc    Get all colleges (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
    res.json(colleges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;