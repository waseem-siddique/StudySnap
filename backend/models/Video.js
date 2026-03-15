const mongoose = require('mongoose');
const videoSchema = new mongoose.Schema({
  
  title: { type: String, required: true },
  description: { type: String, default: '' },
  url: { type: String, required: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  approved: { type: Boolean, default: null }, // null = pending, true = approved, false = rejected
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);

