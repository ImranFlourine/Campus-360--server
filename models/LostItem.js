import mongoose from 'mongoose';

const lostItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electronics', 'books', 'clothing', 'accessories', 'other']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    enum: ['block-a', 'block-b', 'block-c', 'block-d', 'library', 'administrative-block', 'lecture-hall', 'other']
  },
  dateLost: {
    type: Date,
    required: [true, 'Date lost is required']
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['lost', 'claimed'],
    default: 'lost'
  },
  contactDetails: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true
});

// Add text index for search
lostItemSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

const LostItem = mongoose.model('LostItem', lostItemSchema);

export default LostItem; 