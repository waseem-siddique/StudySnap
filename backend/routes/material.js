const router = require('express').Router();
const Material = require('../models/Material');
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
// @desc    Upload PDF study material
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

    const material = new Material({
      title,
      description: description || '',
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.user.id,
      course: courseId || null
    });

    await material.save();

    res.status(201).json({
      id: material._id,
      title: material.title,
      fileUrl: material.fileUrl,
      uploadedBy: material.uploadedBy,
      course: material.course,
      createdAt: material.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/materials
// @desc    Get all study materials
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const materials = await Material.find()
      .populate('uploadedBy', 'username name')
      .populate('course', 'name code')
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/materials/course/:courseId
// @desc    Get materials by course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const materials = await Material.find({ course: req.params.courseId })
      .populate('uploadedBy', 'username name')
      .sort({ createdAt: -1 });

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