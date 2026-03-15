const router = require('express').Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const chatUploadDir = path.join(__dirname, '../uploads/group-chat');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

// Multer config for group file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatUploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'group-' + unique + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files are allowed'), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('file');

// @route   POST /api/groups
// @desc    Create a new study group
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = new Group({
      name,
      description,
      createdBy: req.user.id,
      members: [req.user.id]
    });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups/my
// @desc    Get all groups the user is a member of
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('createdBy', 'username name')
      .populate('members', 'username name');
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups
// @desc    Get all groups (for discovery)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find().populate('createdBy', 'username name');
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups/:id
// @desc    Get a single group by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'username name')
      .populate('members', 'username name');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already a member' });
    }
    group.members.push(req.user.id);
    await group.save();
    res.json({ message: 'Joined group' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(req.user.id)) {
      return res.status(400).json({ error: 'Not a member' });
    }
    group.members = group.members.filter(id => id.toString() !== req.user.id);
    await group.save();
    res.json({ message: 'Left group' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups/:id/messages
// @desc    Get all messages in a group
// @access  Private (must be member)
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not a member' });
    }
    const messages = await GroupMessage.find({ group: req.params.id })
      .populate('sender', 'username name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/groups/:id/messages
// @desc    Send a text message to a group
// @access  Private (must be member)
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not a member' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const message = new GroupMessage({
      group: group._id,
      sender: req.user.id,
      content
    });
    await message.save();
    await message.populate('sender', 'username name');
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/groups/:id/upload
// @desc    Upload a file to a group
// @access  Private (must be member)
router.post('/:id/upload', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File size cannot exceed 5MB' });
      return res.status(400).json({ error: err.message });
    }

    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (!group.members.includes(req.user.id)) {
        return res.status(403).json({ error: 'Not a member' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const message = new GroupMessage({
        group: group._id,
        sender: req.user.id,
        fileUrl: `/uploads/group-chat/${req.file.filename}`,
        fileName: req.file.originalname
      });
      await message.save();
      await message.populate('sender', 'username name');
      res.status(201).json(message);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

module.exports = router;