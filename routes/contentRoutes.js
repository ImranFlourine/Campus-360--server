import express from 'express';
import { uploadContent, getContent, downloadContent, approveContent } from '../controllers/contentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Public routes
router.get('/', getContent);
router.get('/download/:id', downloadContent);

// Protected routes
router.post('/upload', protect, upload.single('file'), uploadContent);

// Admin routes
router.patch('/approve/:id', protect, admin, approveContent);

export default router; 