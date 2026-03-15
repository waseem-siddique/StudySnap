const router = require('express').Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

/**
 * Helper to create a notification with logging
 */
const createNotification = async (recipientId, senderId, type, message, link = null) => {
  try {
    console.log(`Creating notification: recipient=${recipientId}, sender=${senderId}, type=${type}`);
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      link
    });
    await notification.save();
    console.log('Notification saved successfully');
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

/**
 * POST /api/connections/request/:username
 * Send a connection request to another user by username
 */
router.post('/request/:username', auth, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    const currentUser = await User.findById(req.user.id);

    if (currentUser.connections.includes(targetUser._id)) {
      return res.status(400).json({ error: 'Already connected' });
    }

    if (targetUser.pendingRequests.includes(currentUser._id)) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    targetUser.pendingRequests.push(currentUser._id);
    await targetUser.save();

    const message = `${currentUser.name || currentUser.username} has sent you a connection request.`;
    const link = '/connect?tab=pending';
    await createNotification(targetUser._id, currentUser._id, 'connection_request', message, link);

    res.json({ message: 'Connection request sent' });
  } catch (err) {
    console.error('Error in request route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/connections/accept/:userId
 * Accept a connection request
 */
router.post('/accept/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requesterId = req.params.userId;

    if (!currentUser.pendingRequests.includes(requesterId)) {
      return res.status(400).json({ error: 'No pending request from this user' });
    }

    // Remove from pending
    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      id => id.toString() !== requesterId
    );
    // Add to connections (avoid duplicates)
    if (!currentUser.connections.includes(requesterId)) {
      currentUser.connections.push(requesterId);
    }
    await currentUser.save();

    const requester = await User.findById(requesterId);
    if (!requester.connections.includes(currentUser._id)) {
      requester.connections.push(currentUser._id);
    }
    await requester.save();

    const message = `${currentUser.name || currentUser.username} accepted your connection request.`;
    const link = `/profile/${currentUser._id}`;
    await createNotification(requesterId, currentUser._id, 'connection_accepted', message, link);

    res.json({ message: 'Connection accepted' });
  } catch (err) {
    console.error('Error in accept route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/connections/reject/:userId
 * Reject a connection request
 */
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const requesterId = req.params.userId;

    if (!currentUser.pendingRequests.includes(requesterId)) {
      return res.status(400).json({ error: 'No pending request from this user' });
    }

    currentUser.pendingRequests = currentUser.pendingRequests.filter(
      id => id.toString() !== requesterId
    );
    await currentUser.save();

    const message = `${currentUser.name || currentUser.username} rejected your connection request.`;
    await createNotification(requesterId, currentUser._id, 'connection_rejected', message);

    res.json({ message: 'Connection request rejected' });
  } catch (err) {
    console.error('Error in reject route:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/connections/pending
 * Get list of pending connection requests (with full user details)
 */
router.get('/pending', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('pendingRequests', 'username name college course');
    res.json(user.pendingRequests);
  } catch (err) {
    console.error('❌ Error in /pending:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/connections
 * Get list of connections (with full user details)
 */
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('connections', 'username name college course');
    res.json(user.connections);
  } catch (err) {
    console.error('Error fetching connections:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/connections/:userId
 * Remove a connection
 */
router.delete('/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const otherUserId = req.params.userId;

    if (!currentUser.connections.includes(otherUserId)) {
      return res.status(400).json({ error: 'Not connected' });
    }

    // Remove from current user's connections
    currentUser.connections = currentUser.connections.filter(
      id => id.toString() !== otherUserId
    );
    await currentUser.save();

    // Remove from other user's connections
    const otherUser = await User.findById(otherUserId);
    if (otherUser) {
      otherUser.connections = otherUser.connections.filter(
        id => id.toString() !== req.user.id
      );
      await otherUser.save();
    }

    res.json({ message: 'Connection removed' });
  } catch (err) {
    console.error('Error removing connection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;