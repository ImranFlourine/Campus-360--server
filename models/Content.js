import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  program: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: String,
  }],
  isApproved: {
    type: Boolean,
    default: false,
  },
});

const Content = mongoose.model('Content', contentSchema);

export default Content; 