import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  createFoundItem,
  getFoundItems,
  getFoundItem,
  updateFoundItem,
  deleteFoundItem,
  claimFoundItem,
  getSimilarLostItems
} from '../controllers/foundItemController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload only images.'), false);
    }
  }
});

// Routes
router.post('/', protect, upload.array('images', 4), createFoundItem);
router.get('/', getFoundItems);
router.get('/:id', getFoundItem);
router.put('/:id', protect, upload.array('images', 4), updateFoundItem);
router.delete('/:id', protect, deleteFoundItem);
router.post('/:id/claim', protect, claimFoundItem);
router.get('/:id/similar', getSimilarLostItems);

export default router; 