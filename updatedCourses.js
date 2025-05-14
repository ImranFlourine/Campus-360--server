import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs'

// Load environment variables from .env file
dotenv.config();

// Load updated course data from JSON file
const coursesData = JSON.parse(fs.readFileSync('updatedCourses.json', 'utf8'));

// Define the Course Schema
const courseSchema = new mongoose.Schema({
  courseTitle: { type: String, required: true },
  subTitle: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  courseLevel: { type: String, required: true },
  coursePrice: { type: Number, required: true },
  courseThumbnail: { type: String, required: true },
  enrolledStudents: { type: [String], default: [] },
  lectures: { type: [String], default: [] },
  creator: { type: String, required: true },
  isPublished: { type: Boolean, default: true }
});

// Create the Course model
const Course = mongoose.model('Course', courseSchema);

// Function to connect to MongoDB and upload data
async function uploadCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing courses (optional, remove if you don't want to delete existing data)
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Insert new courses
    await Course.insertMany(coursesData);
    console.log('Successfully uploaded', coursesData.length, 'courses');

  } catch (error) {
    console.error('Error uploading courses:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the upload function
uploadCourses();