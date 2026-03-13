const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Routes (to be added later)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/materials', require('./routes/material'));
app.use('/api/videos', require('./routes/video'));
app.use('/api/connections', require('./routes/connection'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/quizzes', require('./routes/quiz'));
app.use('/api/groups', require('./routes/group'));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('StudySnap API is running...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Inside server.js or a separate seed file
/*const College = require('./models/College');
const colleges = [
  { name: 'KAMALA INSTITUTE OF TECHNOLOGY & SCIENCE', location: 'Karimnagar' },
  { name: 'SVS GROUP OF INSTITUTIONS', location: 'Hanamkonda' },
  { name: 'VIGNAN INSTITUTE OF TECHNOLOGY & SCIENCE', location: 'Hyderabad' },
  { name: 'CMR COLLEGE OF ENGINEERING & TECHNOLOGY', location: 'Hyderabad' },
  { name: 'GOKARAJU RANGARAJU INSTITUTE OF ENGINEERING & TECHNOLOGY', location: 'Hyderabad' }
];
College.insertMany(colleges).then(() => console.log('Colleges added'));*/