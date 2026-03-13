const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/connections/request/:username
// @desc    Send connection request to another user by username
// @access  Private
router.post('/request/:username', auth, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot send request to self
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const currentUser = await User.findById(req.user.id);

    // Check if already connected
    if (currentUser.connections.includes(targetUser._id)) {
      return res.status(400).json({ error: 'Already connected' });
    }

    // Check if request already pending
    if (targetUser.pendingRequests.includes(currentUser._id)) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    // Add to target's pending requests
    targetUser.pendingRequests.push(currentUser._id);
    await targetUser.save();

    res.json({ message: 'Connection request sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/connections/accept/:userId
// @desc    Accept a connection request
// @access  Private
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requesterId = req.params.userId;

    // Check if request exists
    if (!currentUser.pendingRequests.includes(requesterId)) {
      return res.status(400).json({ error: 'No pending request from this user' });
    }

    // Remove from pending and add to connections for both users
    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      id => id.toString() !== requesterId
    );
    currentUser.connections.push(requesterId);
    await currentUser.save();

    const requester = await User.findById(requesterId);
    requester.connections.push(currentUser._id);
    await requester.save();

    res.json({ message: 'Connection accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/connections/reject/:userId
// @desc    Reject a connection request
// @access  Private
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requesterId = req.params.userId;

    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      id => id.toString() !== requesterId
    );
    await currentUser.save();

    res.json({ message: 'Connection request rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/connections/pending
// @desc    Get list of pending connection requests
// @access  Private
router.get('/pending', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('pendingRequests', 'username name college');

    res.json(user.pendingRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/connections
// @desc    Get list of connections
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('connections', 'username name college');

    res.json(user.connections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/connections/:userId
// @desc    Remove a connection
// @access  Private
router.delete('/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const otherUserId = req.params.userId;

    if (!currentUser.connections.includes(otherUserId)) {
      return res.status(400).json({ error: 'Not connected' });
    }

    // Remove from both users
    currentUser.connections = currentUser.connections.filter(
      id => id.toString() !== otherUserId
    );
    await currentUser.save();

    const otherUser = await User.findById(otherUserId);
    otherUser.connections = otherUser.connections.filter(
      id => id.toString() !== req.user.id
    );
    await otherUser.save();

    res.json({ message: 'Connection removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;