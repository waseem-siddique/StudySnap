const router = require('express').Router();
const User = require('../models/User');
const Professor = require('../models/Professor');
const Admin = require('../models/Admin');
const Transaction = require('../models/Transaction');
const Material = require('../models/Material');
const Video = require('../models/Video');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// @route   GET /api/users/me
// @desc    Get current user profile (supports students, professors, and admins)
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const admin = await Admin.findById(req.user.id).select('-password');
      if (!admin) return res.status(404).json({ error: 'Admin not found' });
      return res.json({
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      });
    }

    if (req.user.role === 'professor') {
      const professor = await Professor.findById(req.user.id)
        .populate('college', 'name')
        .populate('courses', 'name code');
      if (!professor) return res.status(404).json({ error: 'Professor not found' });
      return res.json({
        id: professor._id,
        name: professor.name,
        email: professor.email,
        college: professor.college,
        courses: professor.courses,
        approved: professor.approved,
        role: 'professor',
      });
    }

    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('college', 'name')
      .populate('course', 'name code');

    if (!user) return res.status(404).json({ error: 'User not found' });

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

// @route   PUT /api/users/profile
// @desc    Update student profile (name, college, course)
// @access  Private (students only)
router.put('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can update profile' });
    }

    const { name, college, course } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (college) updateFields.college = college;
    if (course) updateFields.course = course;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { returnDocument: 'after' }
    )
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

// @route   PUT /api/users/professor/profile
// @desc    Update professor profile (name, courses)
// @access  Private (professors only)
router.put('/professor/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ error: 'Only professors can update professor profile' });
    }

    const { name, courses } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (courses) updateFields.courses = courses;

    const professor = await Professor.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { returnDocument: 'after' }
    )
      .populate('college', 'name')
      .populate('courses', 'name code');

    res.json({
      id: professor._id,
      name: professor.name,
      college: professor.college,
      courses: professor.courses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/checkin
// @desc    Daily check-in (students only)
// @access  Private
router.post('/checkin', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can check in' });
  }
  try {
    const user = await User.findById(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;

    if (lastLogin) {
      lastLogin.setHours(0, 0, 0, 0);
      if (lastLogin.getTime() === today.getTime()) {
        return res.status(400).json({ error: 'Already checked in today' });
      }
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastLogin.getTime() === yesterday.getTime()) {
        user.dailyStreak += 1;
      } else {
        user.dailyStreak = 1;
      }
    } else {
      user.dailyStreak = 1;
    }

    user.lastLogin = new Date();
    user.studyTokens += 10;
    await user.save();

    const transaction = new Transaction({
      user: user._id,
      type: 'checkin',
      amount: 10,
      description: 'Daily check-in bonus',
      balanceAfter: user.studyTokens
    });
    await transaction.save();

    const activity = new Activity({
      user: user._id,
      type: 'checkin',
      description: `Daily check-in (streak: ${user.dailyStreak})`,
      metadata: { streak: user.dailyStreak, tokens: 10 }
    });
    await activity.save();

    res.json({ streak: user.dailyStreak, tokens: user.studyTokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/scan-id
// @desc    Process ID card scan (students only)
// @access  Private
router.post('/scan-id', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can scan ID' });
  }
  try {
    const { rollNo } = req.body;
    if (!rollNo) return res.status(400).json({ error: 'Roll number is required' });

    const user = await User.findById(req.user.id);

    if (!user.rollNo) {
      user.rollNo = rollNo;
      user.studyTokens += 5;
      user.lastScan = new Date();
      user.scanCountToday = 1;
      await user.save();

      const transaction = new Transaction({
        user: user._id,
        type: 'scan',
        amount: 5,
        description: 'First ID scan',
        balanceAfter: user.studyTokens
      });
      await transaction.save();

      const activity = new Activity({
        user: user._id,
        type: 'scan',
        description: 'First ID scan – 5 tokens',
        metadata: { rollNo, tokens: 5 }
      });
      await activity.save();

      return res.json({ message: 'First scan! 5 tokens awarded.', tokens: user.studyTokens });
    }

    if (user.rollNo !== rollNo) {
      return res.status(400).json({ error: `Only your ID is allowed. Your Roll No: ${user.rollNo}` });
    }

    const now = new Date();
    const lastScanDate = user.lastScan ? new Date(user.lastScan).toDateString() : null;
    const todayDate = now.toDateString();
    if (lastScanDate !== todayDate) user.scanCountToday = 0;

    if (user.scanCountToday >= 2) {
      return res.status(400).json({ error: 'Maximum 2 scans per day reached.' });
    }

    let tokensAwarded;
    if (user.lastScan) {
      const hoursSinceLastScan = (now - user.lastScan) / (1000 * 60 * 60);
      if (hoursSinceLastScan < 3) {
        const remainingHours = (3 - hoursSinceLastScan).toFixed(1);
        return res.status(400).json({
          error: `You must wait at least 3 hours between scans. Please try again in ${remainingHours} hours.`,
        });
      }
      tokensAwarded = hoursSinceLastScan >= 6 ? 5 : 2.5;
    } else {
      tokensAwarded = 5;
    }

    user.studyTokens += tokensAwarded;
    user.lastScan = now;
    user.scanCountToday += 1;
    await user.save();

    const transaction = new Transaction({
      user: user._id,
      type: 'scan',
      amount: tokensAwarded,
      description: 'ID scan reward',
      balanceAfter: user.studyTokens
    });
    await transaction.save();

    const activity = new Activity({
      user: user._id,
      type: 'scan',
      description: `ID scan – earned ${tokensAwarded} tokens`,
      metadata: { rollNo, tokens: tokensAwarded }
    });
    await activity.save();

    res.json({ message: `Scan successful! +${tokensAwarded} tokens`, tokens: user.studyTokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/transactions
// @desc    Get current user's token transaction history (students only)
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students have transactions' });
  }
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/activities
// @desc    Get recent user activities (for dashboard feed)
// @access  Private
router.get('/activities', auth, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/search?username=
// @desc    Search users by username (for connections)
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username query required' });

    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('username name college course');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get public profile of another user (student or professor)
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

    let targetUser = await User.findById(req.params.userId)
      .populate('college', 'name')
      .populate('course', 'name code');
    let role = 'student';
    let isConnected = false;

    if (!targetUser) {
      targetUser = await Professor.findById(req.params.userId)
        .populate('college', 'name')
        .populate('courses', 'name code');
      role = 'professor';
    }

    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (role === 'student') {
      isConnected = currentUser.connections.includes(targetUser._id);
    }

    let materials = [];
    let videos = [];

    if (role === 'student') {
      if (isConnected) {
        materials = await Material.find({ uploadedBy: targetUser._id })
          .select('title description fileUrl createdAt')
          .sort({ createdAt: -1 });
      }
    } else if (role === 'professor') {
      videos = await Video.find({ professor: targetUser._id, approved: true })
        .select('title description url createdAt')
        .sort({ createdAt: -1 });
    }

    const response = {
      id: targetUser._id,
      username: targetUser.username || null,
      name: targetUser.name,
      email: targetUser.email,
      college: targetUser.college,
      role,
      isConnected: role === 'student' ? isConnected : false,
      materials,
      videos
    };

    if (role === 'student') response.course = targetUser.course;
    else if (role === 'professor') {
      response.courses = targetUser.courses;
      response.approved = targetUser.approved;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

  // @route   PUT /api/users/professor/profile
// @desc    Update professor profile (name, courses)
// @access  Private (professors only)
router.put('/professor/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ error: 'Only professors can update professor profile' });
    }

    const { name, courses } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (courses) updateFields.courses = courses;

    const professor = await Professor.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { returnDocument: 'after' }
    )
      .populate('college', 'name')
      .populate('courses', 'name code');

    res.json({
      id: professor._id,
      name: professor.name,
      college: professor.college,
      courses: professor.courses
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;