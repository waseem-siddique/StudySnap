const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const College = require('./models/College');
const Course = require('./models/Course');

dotenv.config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Ensure correct indexes on Course collection
    try {
      const courseCollection = mongoose.connection.collection('courses');
      // Drop old index on 'code' if it exists
      await courseCollection.dropIndex('code_1').catch(err => {
        if (err.code !== 27) console.log('Note: code_1 index may not exist or other error', err.message);
      });
      // Create compound index on code and college
      await courseCollection.createIndex({ code: 1, college: 1 }, { unique: true });
      console.log('✅ Indexes updated on courses collection');
    } catch (err) {
      console.error('Index update error:', err);
    }

    // Seed Colleges
    const collegesData = [
      { name: 'KAMALA INSTITUTE OF TECHNOLOGY & SCIENCE', location: 'Karimnagar' },
      { name: 'SVS GROUP OF INSTITUTIONS', location: 'Hanamkonda' },
      { name: 'VIGNAN INSTITUTE OF TECHNOLOGY & SCIENCE', location: 'Hyderabad' },
      { name: 'CMR COLLEGE OF ENGINEERING & TECHNOLOGY', location: 'Hyderabad' },
      { name: 'GOKARAJU RANGARAJU INSTITUTE OF ENGINEERING & TECHNOLOGY', location: 'Hyderabad' }
    ];

    const collegeIds = [];
    for (const data of collegesData) {
      const college = await College.findOneAndUpdate(
        { name: data.name },
        { $set: data },
        { upsert: true, new: true }
      );
      collegeIds.push(college._id);
      console.log(`✅ College: ${college.name}`);
    }

    // Seed Courses
    const courseList = [
      { name: 'Computer Science & Engineering', code: 'CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE' },
      { name: 'Electrical & Electronics Engineering', code: 'EEE' },
      { name: 'Mechanical Engineering', code: 'MECH' },
      { name: 'Civil Engineering', code: 'CIVIL' },
      { name: 'Information Technology', code: 'IT' },
      { name: 'Artificial Intelligence & Data Science', code: 'AIDS' }
    ];

    for (const collegeId of collegeIds) {
      for (const course of courseList) {
        await Course.updateOne(
          { code: course.code, college: collegeId },
          {
            $set: {
              name: course.name,
              code: course.code,
              college: collegeId,
              description: ''
            }
          },
          { upsert: true }
        );
        console.log(`  📘 Course: ${course.code} for college ${collegeId}`);
      }
    }

    console.log('\n🎉 Seeding completed successfully!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Seeding error:', err);
    mongoose.disconnect();
  });