const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * GET /api/users/me
 * Get current user profile (private)
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('college', 'name')
      .populate('course', 'name code');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      mobile: user.mobile,
      email: user.email,
      username: user.username,
      name: user.name,
      college: user.college,
      course: user.course,
      studyTokens: user.studyTokens,
      dailyStreak: user.dailyStreak,
      role: user.role,
      connections: user.connections,
      pendingRequests: user.pendingRequests,
      rollNo: user.rollNo,
      lastScan: user.lastScan,
      scanCountToday: user.scanCountToday,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/users/profile
 * Update user profile (name, college, course)
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, college, course } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (college) updateFields.college = college;
    if (course) updateFields.course = course;

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true })
      .populate('college', 'name')
      .populate('course', 'name code');

    res.json({
      id: user._id,
      name: user.name,
      college: user.college,
      course: user.course,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/users/checkin
 * Daily check-in: increment streak and award tokens
 */
router.post('/checkin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0);

      // Already checked in today
      if (lastLogin.getTime() === today.getTime()) {
        return res.status(400).json({ error: 'Already checked in today' });
      }

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Consecutive day
      if (lastLogin.getTime() === yesterday.getTime()) {
        user.dailyStreak += 1;
      } else {
        // Streak broken
        user.dailyStreak = 1;
      }
    } else {
      // First check-in ever
      user.dailyStreak = 1;
    }

    user.lastLogin = new Date();
    user.studyTokens += 10; // Reward tokens

    await user.save();

    res.json({
      streak: user.dailyStreak,
      tokens: user.studyTokens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/scan-id', auth, async (req, res) => {
  try {
    const { rollNo } = req.body;
    if (!rollNo) {
      return res.status(400).json({ error: 'Roll number is required' });
    }

    const user = await User.findById(req.user.id);

    // First scan ever
    if (!user.rollNo) {
      user.rollNo = rollNo;
      user.studyTokens += 5;
      user.lastScan = new Date();
      user.scanCountToday = 1;
      await user.save();
      return res.json({
        message: 'First scan! 5 tokens awarded.',
        tokens: user.studyTokens,
      });
    }

    // Verify roll number matches
    if (user.rollNo !== rollNo) {
      return res.status(400).json({
        error: `Only your ID is allowed. Your Roll No: ${user.rollNo}`,
      });
    }

    const now = new Date();
    const lastScanDate = user.lastScan ? new Date(user.lastScan).toDateString() : null;
    const todayDate = now.toDateString();

    // Reset daily counter if it's a new day
    if (lastScanDate !== todayDate) {
      user.scanCountToday = 0;
    }

    // Enforce maximum of 2 scans per day
    if (user.scanCountToday >= 2) {
      return res.status(400).json({ error: 'Maximum 2 scans per day reached.' });
    }

    let tokensAwarded;

    // Enforce minimum 3‑hour gap
    if (user.lastScan) {
      const hoursSinceLastScan = (now - user.lastScan) / (1000 * 60 * 60);
      if (hoursSinceLastScan < 3) {
        const remainingHours = (3 - hoursSinceLastScan).toFixed(1);
        return res.status(400).json({
          error: `You must wait at least 3 hours between scans. Please try again in ${remainingHours} hours.`,
        });
      }

      // Award tokens based on gap
      tokensAwarded = hoursSinceLastScan >= 6 ? 5 : 2.5;
    } else {
      tokensAwarded = 5; // This case shouldn't happen because first scan is handled above
    }

    user.studyTokens += tokensAwarded;
    user.lastScan = now;
    user.scanCountToday += 1;
    await user.save();

    res.json({
      message: `Scan successful! +${tokensAwarded} tokens`,
      tokens: user.studyTokens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/users/search?username=
 * Search users by username (excluding current user) for connections
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ error: 'Username query required' });
    }

    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user.id }, // exclude current user
    }).select('username name college course');

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;