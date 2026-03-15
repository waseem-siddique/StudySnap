const router = require('express').Router();
const Material = require('../models/Material');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity'); // Added for activity feed
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'material-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/materials/upload
// @desc    Upload PDF – requires course, awards tokens if new title
// @access  Private
router.post('/upload', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, courseId, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!courseId) {
      return res.status(400).json({ error: 'Course is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    // Check if the user has already uploaded a material with the same title
    const existingMaterial = await Material.findOne({
      uploadedBy: req.user.id,
      title: title
    });

    // Save the new material
    const material = new Material({
      title,
      description: description || '',
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      course: courseId
    });

    await material.save();

    let tokensEarned = 0;
    let newTokenBalance = null;

    // If no previous upload with this title, award tokens
    if (!existingMaterial) {
      const user = await User.findById(req.user.id);
      tokensEarned = 5;
      user.studyTokens += tokensEarned;
      await user.save();
      newTokenBalance = user.studyTokens;

      // Create transaction record
      const transaction = new Transaction({
        user: user._id,
        type: 'upload',
        amount: tokensEarned,
        description: `Uploaded PDF: ${title}`,
        balanceAfter: user.studyTokens
      });
      await transaction.save();

      // Create activity for dashboard feed
      const activity = new Activity({
        user: user._id,
        type: 'upload',
        description: `Uploaded "${title}" to E‑Library and earned 5 tokens`,
        metadata: { materialTitle: title, tokensEarned }
      });
      await activity.save();
    }

    res.status(201).json({
      id: material._id,
      title: material.title,
      fileUrl: material.fileUrl,
      uploadedBy: material.uploadedBy,
      course: material.course,
      createdAt: material.createdAt,
      updatedAt: material.updatedAt,
      tokensEarned,
      newTokenBalance
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/materials/:id
// @desc    Update material title/description (only by uploader)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check if user is uploader
    if (material.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the uploader can edit this material' });
    }

    if (title) material.title = title;
    if (description !== undefined) material.description = description;
    material.updatedAt = new Date();

    await material.save();
    await material.populate('uploadedBy', 'username name');
    await material.populate('course', 'name code');

    res.json(material);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/materials
// @desc    Get all study materials uploaded by users in the same college
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('college');
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    // If user has no college (shouldn't happen after profile completion), return empty
    if (!currentUser.college) {
      return res.json([]);
    }

    const materials = await Material.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploader'
        }
      },
      { $unwind: '$uploader' },
      {
        $match: {
          'uploader.college': currentUser.college
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          fileUrl: 1,
          course: 1,
          createdAt: 1,
          updatedAt: 1,
          uploadedBy: {
            _id: '$uploader._id',
            username: '$uploader.username',
            name: '$uploader.name'
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Populate course details
    await Material.populate(materials, { path: 'course', select: 'name code' });

    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/materials/course/:courseId
// @desc    Get materials by course (filtered by same college)
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).select('college');
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    if (!currentUser.college) {
      return res.json([]);
    }

    const materials = await Material.aggregate([
      {
        $match: { course: new mongoose.Types.ObjectId(req.params.courseId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploader'
        }
      },
      { $unwind: '$uploader' },
      {
        $match: {
          'uploader.college': currentUser.college
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          fileUrl: 1,
          course: 1,
          createdAt: 1,
          updatedAt: 1,
          uploadedBy: {
            _id: '$uploader._id',
            username: '$uploader.username',
            name: '$uploader.name'
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    await Material.populate(materials, { path: 'course', select: 'name code' });

    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/materials/:id
// @desc    Delete a material (only by uploader or admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check if user is uploader or admin
    if (material.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete file from uploads folder
    const filename = path.basename(material.fileUrl);
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await material.deleteOne();
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;