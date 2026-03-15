const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.1.16:5173'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Serve uploaded video files
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/materials', require('./routes/material'));
app.use('/api/videos', require('./routes/video'));
app.use('/api/connections', require('./routes/connection'));
app.use('/api/quizzes', require('./routes/quiz'));
app.use('/api/group', require('./routes/group'));
app.use('/api/courses', require('./routes/course')); // single course route
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/colleges', require('./routes/college'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/activities', require('./routes/activities'));

// Serve static frontend files in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Catch-all: serve frontend's index.html for any non-API route (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('StudySnap API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});