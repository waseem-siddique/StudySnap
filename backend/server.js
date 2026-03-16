const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration – allow local development origins
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.16:5173',
    'https://studysnap-1-nj7j.onrender.com',
    'https://studysnap-murex.vercel.app' // <-- add your actual frontend URL
  ],
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// Serve uploaded video files
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/materials', require('./routes/material'));
app.use('/api/videos', require('./routes/video'));
app.use('/api/connections', require('./routes/connection'));
app.use('/api/quizzes', require('./routes/quiz'));
app.use('/api/group', require('./routes/group'));
app.use('/api/courses', require('./routes/course'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/colleges', require('./routes/college'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/activities', require('./routes/activities'));

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Basic route for testing (optional)
app.get('/', (req, res) => {
  res.send('StudySnap API is running...');
});

// For production: serve frontend for any non‑API route
if (process.env.NODE_ENV === 'production') {
  app.get('/:path(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
