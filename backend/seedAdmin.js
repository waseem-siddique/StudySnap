const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./models/Admin'); // Make sure the path is correct

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@studysnap.com' });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      name: 'Super Admin',
      email: 'admin@studysnap.com',
      password: 'admin123' // This will be hashed automatically by the pre-save hook
    });

    await admin.save();
    console.log('Admin created successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
    process.exit();
  }
};

createAdmin();