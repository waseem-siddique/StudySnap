const router = require('express').Router();
const Video = require('../models/Video');
const User = require('../models/User');
const Professor = require('../models/Professor');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure video uploads directory exists
const videoUploadDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

// Configure multer for video files (mp4, webm, etc.)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, webm, ogg, mov)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
}).single('video');

// @route   POST /api/videos/upload
// @desc    Upload a video lecture (professor only)
// @access  Private (professor)
router.post('/upload', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size cannot exceed 100MB' });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file uploaded' });
      }

      // Check if user is professor
      if (req.user.role !== 'professor') {
        return res.status(403).json({ error: 'Only professors can upload videos' });
      }

      const { title, description, courseId } = req.body;
      if (!title || !courseId) {
        return res.status(400).json({ error: 'Title and course are required' });
      }

      const professor = await Professor.findOne({ email: req.user.email });
      if (!professor) {
        return res.status(404).json({ error: 'Professor not found' });
      }

       const video = new Video({
        title,
        description,
        url: `/uploads/videos/${req.file.filename}`,
        professor: professor._id,
        course: courseId,
        approved: null // pending
      });
      await video.save();
      res.status(201).json({ message: 'Video uploaded successfully, pending approval', video });
    } catch (err) { /* ... */ }
  });
});

// @route   GET /api/videos/my
// @desc    Get videos uploaded by current professor
// @access  Private (professor)
router.get('/my', auth, async (req, res) => {
  try {
    if (req.user.role !== 'professor') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const professor = await Professor.findOne({ email: req.user.email });
    if (!professor) return res.status(404).json({ error: 'Professor not found' });

    const videos = await Video.find({ professor: professor._id })
      .populate('course', 'name code')
      .sort({ createdAt: -1 });
    res.json(videos);
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

// @route   GET /api/videos/pending
// @desc    Get all pending videos (admin only)
// @access  Private (admin)
router.get('/pending', auth, async (req, res) => {
  try {
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

/// @route   PUT /api/videos/:id/approve
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
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;