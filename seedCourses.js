// server/seedCourses.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { Course } from './models/course.model.js';

dotenv.config(); // ✅ Load env variables from .env

async function seedCourses() {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) throw new Error('Mongo URI not found in .env file');

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    const courses = JSON.parse(fs.readFileSync('./updatedCourses.json', 'utf-8'));
    await Course.deleteMany({});
    await Course.insertMany(courses);
    console.log('✅ Courses inserted successfully');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error inserting courses:', error.message);
    process.exit(1);
  }
}

seedCourses();
