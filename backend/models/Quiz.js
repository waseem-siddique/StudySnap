const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctOption: {
    type: Number, // index of correct option (0-based)
    required: true
  },
  points: {
    type: Number,
    default: 10
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  questions: [questionSchema],
  timeLimit: {
    type: Number, // in minutes, 0 = no limit
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor', // or User with role professor
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to calculate total points
quizSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  next();
});

module.exports = mongoose.model('Quiz', quizSchema);