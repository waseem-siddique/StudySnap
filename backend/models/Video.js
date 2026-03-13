const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    required: true // Could be YouTube link or cloud storage URL
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professor',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  approved: {
    type: Boolean,
    default: false // Admin must approve before students see it
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Video', videoSchema);