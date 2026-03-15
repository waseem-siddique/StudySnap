const router = require('express').Router();
const Course = require('../models/Course');

// @route   GET /api/courses
// @desc    Get courses by college (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { college } = req.query;
    if (!college) {
      return res.status(400).json({ error: 'College ID is required' });
    }
    const courses = await Course.find({ college }).sort({ name: 1 });
    res.json(courses);
  } catch (err) {
    console.error('❌ Error in GET /api/courses:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;