const router = require('express').Router();
const Video = require('../models/Video');
const Professor = require('../models/Professor');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/videos/upload
// @desc    Upload a new video lecture (professor only)
// @access  Private (professor)
router.post('/upload', auth, async (req, res) => {
  try {
    // Check if user is professor
    // For now, we'll assume professors are stored in Professor model with same email as user
    // Alternatively, we could add a role field to User and check that.
    // Here we'll check if the user's email exists in Professor collection
    const user = await User.findById(req.user.id);
    const professor = await Professor.findOne({ email: user.email });
    
    if (!professor) {
      return res.status(403).json({ error: 'Only professors can upload videos' });
    }

    const { title, description, url, courseId } = req.body;

    if (!title || !url || !courseId) {
      return res.status(400).json({ error: 'Title, URL, and course are required' });
    }

    const video = new Video({
      title,
      description,
      url,
      professor: professor._id,
      course: courseId,
      approved: false // Needs admin approval
    });

    await video.save();

    res.status(201).json({
      id: video._id,
      title: video.title,
      description: video.description,
      url: video.url,
      professor: professor._id,
      course: video.course,
      approved: video.approved,
      createdAt: video.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos
// @desc    Get all approved videos (for students)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const videos = await Video.find({ approved: true })
      .populate('professor', 'name')
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/professor/:professorId
// @desc    Get videos by professor (only approved)
// @access  Private
router.get('/professor/:professorId', auth, async (req, res) => {
  try {
    const videos = await Video.find({ 
      professor: req.params.professorId,
      approved: true 
    }).populate('course', 'name code');

    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/videos/pending
// @desc    Get all pending videos (admin only)
// @access  Private (admin)
router.get('/pending', auth, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const videos = await Video.find({ approved: false })
      .populate('professor', 'name email')
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/videos/:id/approve
// @desc    Approve or reject a video (admin only)
// @access  Private (admin)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { approved } = req.body; // true or false

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { approved },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ 
      id: video._id, 
      approved: video.approved,
      message: `Video ${approved ? 'approved' : 'rejected'} successfully` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;