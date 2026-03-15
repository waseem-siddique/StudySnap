const router = require('express').Router();
const User = require('../models/User');
const Professor = require('../models/Professor');
const College = require('../models/College');
const Course = require('../models/Course');
const Video = require('../models/Video');
const Material = require('../models/Material');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Middleware to check if user is admin (supports both User and Admin models)
const isAdmin = async (req, res, next) => {
  try {
    // First try to find in User collection (for backward compatibility)
    const user = await User.findById(req.user.id);
    if (user && user.role === 'admin') {
      req.user.role = 'admin'; // ensure role is set
      return next();
    }

    // If not found or not admin, try Admin collection
    const Admin = require('../models/Admin'); // lazy import to avoid circular dependency
    const admin = await Admin.findById(req.user.id);
    if (admin) {
      req.user.role = 'admin';
      return next();
    }

    return res.status(403).json({ error: 'Admin access required' });
  } catch (err) {
    console.error('isAdmin middleware error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ==================== College Routes ====================
// @route   GET /api/admin/colleges
// @desc    Get all colleges
// @access  Private (Admin)
router.get('/colleges', auth, isAdmin, async (req, res) => {
  try {
    const colleges = await College.find().sort({ name: 1 });
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
    if (!name) return res.status(400).json({ error: 'College name is required' });
    const college = new College({ name, location });
    await college.save();
    res.status(201).json(college);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/colleges/:id
// @desc    Update a college
// @access  Private (Admin)
router.put('/colleges/:id', auth, isAdmin, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!college) return res.status(404).json({ error: 'College not found' });
    res.json(college);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/colleges/:id
// @desc    Delete a college
// @access  Private (Admin)
router.delete('/colleges/:id', auth, isAdmin, async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) return res.status(404).json({ error: 'College not found' });
    res.json({ message: 'College deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Course Routes ====================
// @route   GET /api/admin/courses
// @desc    Get all courses (optionally filtered by college)
// @access  Private (Admin)
router.get('/courses', auth, isAdmin, async (req, res) => {
  try {
    const { college } = req.query;
    const filter = college ? { college } : {};
    const courses = await Course.find(filter)
      .populate('college', 'name')
      .sort({ name: 1 });
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
    if (!name || !code || !college) {
      return res.status(400).json({ error: 'Name, code, and college are required' });
    }
    const course = new Course({ name, code, college, description });
    await course.save();
    await course.populate('college', 'name');
    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/courses/:id
// @desc    Update a course
// @access  Private (Admin)
router.put('/courses/:id', auth, isAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('college', 'name');
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/courses/:id
// @desc    Delete a course
// @access  Private (Admin)
router.delete('/courses/:id', auth, isAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Student Routes ====================
// @route   GET /api/admin/users
// @desc    Get all students (optionally filtered by college and course)
// @access  Private (Admin)
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { college, course } = req.query;
    let filter = { role: 'student' };
    if (college) filter.college = college;
    if (course) filter.course = course;

    const users = await User.find(filter)
      .populate('college', 'name')
      .populate('course', 'name code')
      .select('-password -pendingRequests -connections');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a student
// @access  Private (Admin)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ==================== Professor Routes ====================
// @route   GET /api/admin/professors
// @desc    Get all professors (both approved and pending)
// @access  Private (Admin)
router.get('/professors', auth, isAdmin, async (req, res) => {
  try {
    const professors = await Professor.find()
      .populate('college', 'name')
      .populate('courses', 'name');
    res.json(professors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/professors/pending
// @desc    Get all professors pending approval
// @access  Private (Admin)
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

// @route   PUT /api/admin/professors/:id/approve
// @desc    Approve or reject a professor
// @access  Private (Admin)
router.put('/professors/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const { approved } = req.body;
    const professor = await Professor.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    );
    if (!professor) return res.status(404).json({ error: 'Professor not found' });
    res.json(professor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/professors/:id
// @desc    Delete a professor
// @access  Private (Admin)
router.delete('/professors/:id', auth, isAdmin, async (req, res) => {
  try {
    const professor = await Professor.findByIdAndDelete(req.params.id);
    if (!professor) return res.status(404).json({ error: 'Professor not found' });
    res.json({ message: 'Professor deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Video Routes ====================
// @route   GET /api/admin/videos/pending
// @desc    Get all pending videos
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
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== Statistics ====================
// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin)
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalProfessors = await Professor.countDocuments();
    const pendingProfessors = await Professor.countDocuments({ approved: false });
    const totalColleges = await College.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalVideos = await Video.countDocuments();
    const pendingVideos = await Video.countDocuments({ approved: false });
    const totalMaterials = await Material.countDocuments();

    res.json({
      totalStudents,
      totalProfessors,
      pendingProfessors,
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


  // @route   POST /api/admin/notifications
// @desc    Send a notification to a specific user (admin only)
// @access  Private (Admin)
router.post('/notifications', auth, isAdmin, async (req, res) => {
  try {
    const { userId, message, link } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message required' });
    }

    const notification = new Notification({
      recipient: userId,
      sender: req.user.id,
      type: 'admin_message',
      message,
      link: link || null
    });
    await notification.save();

    res.status(201).json({ message: 'Notification sent' });
  } catch (err) {
    console.error('❌ POST /api/admin/notifications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;