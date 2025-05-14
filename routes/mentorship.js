import express from 'express';
import Mentorship from '../models/Mentorship.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/mentorship'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'));
    }
  }
});

// Create mentorship entry
router.post('/create', upload.single('file'), async (req, res) => {
  try {
    const { program, branch, contentType, contentLink, title, description } = req.body;
    
    const mentorshipData = {
      program,
      branch,
      type: contentType === 'link' ? 'blog' : 'upload',
      title,
      description
    };

    if (contentType === 'link') {
      mentorshipData.link = contentLink;
    } else if (req.file) {
      mentorshipData.fileUrl = `/uploads/mentorship/${req.file.filename}`;
    }

    const mentorship = new Mentorship(mentorshipData);
    await mentorship.save();

    res.status(201).json({
      success: true,
      message: 'Mentorship content created successfully',
      data: mentorship
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all mentorships with optional filtering
router.get('/', async (req, res) => {
  try {
    const { program, branch } = req.query;
    const query = {};

    if (program) query.program = program;
    if (branch) query.branch = branch;

    const mentorships = await Mentorship.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: mentorships
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router; 