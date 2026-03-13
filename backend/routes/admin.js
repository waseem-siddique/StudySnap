const router = require('express').Router();
const User = require('../models/User');
const Professor = require('../models/Professor');
const College = require('../models/College');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Material = require('../models/Material');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ==================== User Management ====================

// @route   GET /api/admin/users
// @desc    Get all students (users)
// @access  Private (Admin)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .populate('college', 'name')
      .populate('course', 'name code')
      .select('-pendingRequests -connections');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private (Admin)
router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('college', 'name')
      .populate('course', 'name code');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (e.g., change role, reset tokens, etc.)
// @access  Private (Admin)
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, role, studyTokens, college, course } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (studyTokens !== undefined) updateData.studyTokens = studyTokens;
    if (college) updateData.college = college;
    if (course) updateData.course = course;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Professor Management ====================

// @route   GET /api/admin/professors
// @desc    Get all professors
// @access  Private (Admin)
router.get('/professors', auth, isAdmin, async (req, res) => {
  try {
    const professors = await Professor.find()
      .populate('college', 'name')
      .populate('courses', 'name code');
    res.json(professors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/professors
// @desc    Add a new professor
// @access  Private (Admin)
router.post('/professors', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, college, courses } = req.body;
    const professor = new Professor({ name, email, college, courses });
    await professor.save();
    res.status(201).json(professor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/professors/:id
// @desc    Update professor
// @access  Private (Admin)
router.put('/professors/:id', auth, isAdmin, async (req, res) => {
  try {
    const professor = await Professor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(professor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/professors/:id
// @desc    Delete professor
// @access  Private (Admin)
router.delete('/professors/:id', auth, isAdmin, async (req, res) => {
  try {
    await Professor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Professor deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== College Management ====================

// @route   GET /api/admin/colleges
// @desc    Get all colleges
// @access  Private (Admin)
router.get('/colleges', auth, isAdmin, async (req, res) => {
  try {
    const colleges = await College.find();
    res.json(colleges);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/colleges
// @desc    Add a new college
// @access  Private (Admin)
router.post('/colleges', auth, isAdmin, async (req, res) => {
  try {
    const { name, location } = req.body;
    const college = new College({ name, location });
    await college.save();
    res.status(201).json(college);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/colleges/:id
// @desc    Update college
// @access  Private (Admin)
router.put('/colleges/:id', auth, isAdmin, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(college);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/colleges/:id
// @desc    Delete college
// @access  Private (Admin)
router.delete('/colleges/:id', auth, isAdmin, async (req, res) => {
  try {
    await College.findByIdAndDelete(req.params.id);
    res.json({ message: 'College deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Course Management ====================

// @route   GET /api/admin/courses
// @desc    Get all courses
// @access  Private (Admin)
router.get('/courses', auth, isAdmin, async (req, res) => {
  try {
    const courses = await Course.find().populate('college', 'name');
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/courses
// @desc    Add a new course
// @access  Private (Admin)
router.post('/courses', auth, isAdmin, async (req, res) => {
  try {
    const { name, code, college, description } = req.body;
    const course = new Course({ name, code, college, description });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update course
// @access  Private (Admin)
router.put('/courses/:id', auth, isAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete course
// @access  Private (Admin)
router.delete('/courses/:id', auth, isAdmin, async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Video Moderation ====================

// @route   GET /api/admin/videos/pending
// @desc    Get all pending videos (already in video.js, but included here for admin completeness)
// @access  Private (Admin)
router.get('/videos/pending', auth, isAdmin, async (req, res) => {
  try {
    const videos = await Video.find({ approved: false })
      .populate('professor', 'name email')
      .populate('course', 'name code');
    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/videos/:id/approve
// @desc    Approve or reject a video
// @access  Private (Admin)
router.put('/videos/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const { approved } = req.body;
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    );
    res.json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Dashboard Stats ====================

// @route   GET /api/admin/stats
// @desc    Get platform statistics for admin dashboard
// @access  Private (Admin)
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalProfessors = await Professor.countDocuments();
    const totalColleges = await College.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalVideos = await Video.countDocuments();
    const pendingVideos = await Video.countDocuments({ approved: false });
    const totalMaterials = await Material.countDocuments();

    res.json({
      totalStudents,
      totalProfessors,
      totalColleges,
      totalCourses,
      totalVideos,
      pendingVideos,
      totalMaterials
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
// Get all pending professors
router.get('/professors/pending', auth, isAdmin, async (req, res) => {
  try {
    const professors = await Professor.find({ approved: false })
      .populate('college', 'name')
      .populate('courses', 'name');
    res.json(professors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve professor
router.put('/professors/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const { approved } = req.body; // true/false
    const professor = await Professor.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    );
    res.json(professor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;