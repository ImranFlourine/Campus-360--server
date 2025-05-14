import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createLostItem,
  getLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
  claimLostItem
} from '../controllers/lostItemController.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Public routes - no authentication required
router.post('/', upload.single('image'), createLostItem);
router.get('/', getLostItems);
router.get('/:id', getLostItemById);
router.put('/:id', upload.single('image'), updateLostItem);
router.delete('/:id', deleteLostItem);
router.post('/:id/claim', claimLostItem);

export default router; 