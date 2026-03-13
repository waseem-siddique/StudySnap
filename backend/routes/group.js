const router = require('express').Router();
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/groups
// @desc    Get all groups (for discovery)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('createdBy', 'username name')
      .populate('members', 'username name');
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups/my
// @desc    Get groups current user is a member of
// @access  Private
router.get('/my', auth, async (req,res) => {
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

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const group = new Group({
      name,
      description,
      createdBy: req.user.id,
      members: [req.user.id] // creator automatically a member
    });

    await group.save();
    res.status(201).json(group);
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
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already member
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ error: 'Already a member' });
    }

    group.members.push(req.user.id);
    await group.save();

    res.json({ message: 'Joined group successfully' });
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
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if member
    if (!group.members.includes(req.user.id)) {
      return res.status(400).json({ error: 'Not a member' });
    }

    group.members = group.members.filter(
      memberId => memberId.toString() !== req.user.id
    );
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;