const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure chat uploads directory exists
const chatUploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
  console.log('📁 Created chat upload directory:', chatUploadDir);
}

// Configure multer for PDF files (max 5MB)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, chatUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('file');

// @route   POST /api/messages
// @desc    Send a message to a connected user (with optional file)
// @access  Private
router.post('/', auth, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size cannot exceed 5MB' });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      const { receiverId, content } = req.body;

      // Validate receiverId
      if (!receiverId) {
        return res.status(400).json({ error: 'Receiver ID is required' });
      }
      if (!mongoose.Types.ObjectId.isValid(receiverId)) {
        return res.status(400).json({ error: 'Invalid receiver ID format' });
      }
      if (!content && !req.file) {
        return res.status(400).json({ error: 'Either message content or a file is required' });
      }

      // Fetch current user
      const currentUser = await User.findById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ error: 'Current user not found' });
      }

      // Check connection
      if (!currentUser.connections.includes(receiverId)) {
        return res.status(403).json({ error: 'You are not connected with this user' });
      }

      // Build message object
      const messageData = {
        sender: req.user.id,
        receiver: receiverId,
        content: content || ''
      };
      if (req.file) {
        messageData.fileUrl = `/uploads/chat/${req.file.filename}`;
        messageData.fileName = req.file.originalname;
      }

      // Save message
      const message = new Message(messageData);
      await message.save();
      await message.populate('sender', 'username name');
      
      console.log('✅ Message sent successfully:', message._id);
      res.status(201).json(message);
    } catch (err) {
      console.error('❌ Error saving message:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// @route   GET /api/messages/:userId
// @desc    Get conversation with another user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username name');

    res.json(messages);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/messages/conversations/list
// @desc    Get list of conversations for current user
// @access  Private
router.get('/conversations/list', auth, async (req, res) => {
  try {
    // Validate current user ID
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.error('❌ Invalid user ID format:', req.user.id);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Use 'new' with ObjectId constructor
    const userId = new mongoose.Types.ObjectId(req.user.id);
    console.log('📋 Fetching conversations for user:', userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'otherUser'
        }
      },
      { $unwind: { path: '$otherUser', preserveNullAndEmptyArrays: false } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$otherUser.username',
          name: '$otherUser.name',
          college: '$otherUser.college',
          lastMessage: {
            content: '$lastMessage.content',
            fileUrl: '$lastMessage.fileUrl',
            fileName: '$lastMessage.fileName',
            createdAt: '$lastMessage.createdAt',
            sender: '$lastMessage.sender'
          },
          unreadCount: 1
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Populate college field if it exists
    if (conversations.length > 0) {
      await User.populate(conversations, { path: 'college', select: 'name' });
    }

    console.log(`✅ Found ${conversations.length} conversations`);
    res.json(conversations);
  } catch (err) {
    console.error('❌ Error in /conversations/list:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;