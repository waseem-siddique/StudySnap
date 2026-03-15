const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true }, // index of correct option (0-based)
  points: { type: Number, default: 10 }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['quiz', 'coding'],
    default: 'quiz'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hardcore'],
    default: 'medium'
  },
  tokenReward: { type: Number, default: 0 }, // tokens awarded on passing
  passingScore: { type: Number, default: 0 }, // minimum points to pass
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  questions: [questionSchema],
  timeLimit: { type: Number, default: 0 }, // minutes, 0 = no limit
  totalPoints: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor' }, // professor who created it
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to calculate total points and set token reward / passing score if not provided
quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  if (!this.tokenReward) {
    // Default token rewards based on difficulty
    const rewards = { easy: 10, medium: 20, hardcore: 30 };
    this.tokenReward = rewards[this.difficulty] || 10;
  }
  if (!this.passingScore) {
    // Default passing score: 50% of total points
    this.passingScore = Math.ceil(this.totalPoints * 0.5);
  }
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);