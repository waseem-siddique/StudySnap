const router = require('express').Router();
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity'); // Added for activity feed
const auth = require('../middleware/auth');

// @route   GET /api/quizzes
// @desc    Get all quizzes (optionally filtered by category)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
    if (category && (category === 'quiz' || category === 'coding')) {
      filter.category = category;
    }
    const quizzes = await Quiz.find(filter)
      .populate('course', 'name code')
      .populate('createdBy', 'name')
      .select('-questions.correctOption'); // hide correct answers
    res.json(quizzes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/quizzes/:id
// @desc    Get a single quiz with questions (for taking quiz)
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'name code')
      .populate('createdBy', 'name');
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/quizzes
// @desc    Create a new quiz (professor only)
// @access  Private (professor)
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is professor (role field on User)
    if (req.user.role !== 'professor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only professors can create quizzes' });
    }

    const { 
      title, 
      description, 
      category, 
      difficulty, 
      tokenReward, 
      passingScore, 
      course, 
      questions, 
      timeLimit 
    } = req.body;

    const quiz = new Quiz({
      title,
      description,
      category: category || 'quiz',
      difficulty: difficulty || 'medium',
      tokenReward,
      passingScore,
      course,
      questions,
      timeLimit,
      createdBy: req.user.id
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers, get score, and award tokens if passed
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { answers } = req.body; // array of selected option indices
    let score = 0;
    const results = [];

    quiz.questions.forEach((q, idx) => {
      const isCorrect = answers[idx] === q.correctOption;
      if (isCorrect) score += q.points;
      results.push({
        question: q.questionText,
        correct: q.correctOption,
        selected: answers[idx],
        isCorrect,
        points: isCorrect ? q.points : 0
      });
    });

    // Determine if passed
    const passed = score >= quiz.passingScore;
    let tokensEarned = 0;
    let updatedUser = null;

    if (passed) {
      tokensEarned = quiz.tokenReward;
      // Award tokens to user
      const user = await User.findById(req.user.id);
      user.studyTokens += tokensEarned;
      updatedUser = await user.save();

      // Create transaction record
      const transaction = new Transaction({
        user: user._id,
        type: 'quiz',
        amount: tokensEarned,
        description: `Quiz: ${quiz.title}`,
        balanceAfter: user.studyTokens
      });
      await transaction.save();

      // Create activity for dashboard feed
      const activity = new Activity({
        user: user._id,
        type: 'quiz',
        description: `Completed "${quiz.title}" and earned ${tokensEarned} tokens`,
        metadata: { quizTitle: quiz.title, score, total: quiz.totalPoints, tokensEarned }
      });
      await activity.save();
    }

    res.json({
      score,
      total: quiz.totalPoints,
      passed,
      tokensEarned,
      newTokenBalance: updatedUser ? updatedUser.studyTokens : null,
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;