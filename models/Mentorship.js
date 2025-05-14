import mongoose from 'mongoose';

const mentorshipSchema = new mongoose.Schema({
  program: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['blog', 'upload'],
    required: true
  },
  link: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Mentorship', mentorshipSchema); 