const router = require('express').Router();
const User = require('../models/User');
const Professor = require('../models/Professor');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// ---------- Student OTP ----------
// @route   POST /api/auth/request-otp
// @desc    Request OTP (demo: always success)
// @access  Public
router.post('/request-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }
  console.log(`OTP request for ${mobile} – use 123456`);
  res.json({ message: 'OTP sent successfully' });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP (demo: only 123456 works) and login/register student
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp, email, username } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile and OTP are required' });
    }
    if (otp !== '123456') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    let user = await User.findOne({ mobile });

    if (!user) {
      if (!email || !username) {
        return res.status(400).json({ error: 'Email and username required for new user' });
      }
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user = new User({ mobile, email, username });
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, mobile: user.mobile, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        mobile: user.mobile,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        studyTokens: user.studyTokens,
        dailyStreak: user.dailyStreak,
        rollNo: user.rollNo,
        lastScan: user.lastScan,
        scanCountToday: user.scanCountToday
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Professor ----------
// @route   POST /api/auth/professor/register
// @desc    Register a new professor (pending admin approval)
// @access  Public
router.post('/professor/register', async (req, res) => {
  try {
    const { name, email, password, college, courses } = req.body;
    console.log('📥 Professor registration attempt:', { name, email, college, courses });

    if (!name || !email || !password || !college) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await Professor.findOne({ email });
    if (existing) {
      console.log('❌ Professor already exists:', email);
      return res.status(400).json({ error: 'Professor already registered' });
    }

    const professor = new Professor({
      name,
      email,
      password,
      college,
      courses: courses || [],
      approved: false
    });

    console.log('📦 Professor object created, about to save...');
    await professor.save();
    console.log('✅ Professor saved successfully, ID:', professor._id);

    res.status(201).json({ message: 'Registration successful. Await admin approval.' });
  } catch (err) {
    console.error('❌ Professor registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/professor/login
// @desc    Professor login (only if approved)
// @access  Public
router.post('/professor/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const professor = await Professor.findOne({ email }).populate('college');
    if (!professor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!professor.approved) {
      return res.status(403).json({ error: 'Account pending admin approval' });
    }

    const isMatch = await professor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: professor._id, email: professor.email, role: 'professor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      professor: {
        id: professor._id,
        name: professor.name,
        email: professor.email,
        college: professor.college,
        courses: professor.courses,
        approved: professor.approved
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Admin ----------
// @route   POST /api/auth/admin/login
// @desc    Admin login (email & password)
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/auth/check-user/:mobile
// @desc    Check if user exists by mobile (for pre-filling OTP form)
// @access  Public
// @route   GET /api/auth/check-user/:mobile
router.get('/check-user/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    const user = await User.findOne({ mobile }).select('email username');
    if (user) {
      res.json({ exists: true, email: user.email, username: user.username });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;