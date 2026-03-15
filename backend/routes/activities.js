const router = require('express').Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// @route   GET /api/activities
// @desc    Get recent activities for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;