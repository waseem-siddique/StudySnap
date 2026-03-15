const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  
  name: {
    type: String,
    trim: true
  },
  rollNo: { type: String, default: '' },
  lastScan: { type: Date },
  scanCountToday: { type: Number, default: 0 },
  
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  studyTokens: {
    type: Number,
    default: 0
  },
  dailyStreak: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ['student', 'professor', 'admin'],
    default: 'student'
  },
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
createdAt: {
  type: Date,
  default: Date.now
}
});

module.exports = mongoose.model('User', userSchema);