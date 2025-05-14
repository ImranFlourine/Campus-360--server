import mongoose from 'mongoose';

const foundItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    enum: ['Block A', 'Block B', 'Library', 'Administrative Block', 'Road']
  },
  category: {
    type: String,
    required: true,
    enum: ['Stationery', 'Electronics', 'Clothing', 'Documents', 'Accessories', 'Miscellaneous']
  },
  dateTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Claimed', 'Unclaimed'],
    default: 'Unclaimed'
  },
  images: [{
    type: String
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  claimDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Add text index for search
foundItemSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

const FoundItem = mongoose.model('FoundItem', foundItemSchema);

export default FoundItem; 