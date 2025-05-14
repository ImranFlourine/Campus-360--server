import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const lostFoundUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  profilePicture: {
    type: String
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  bio: {
    type: String
  },
  reportedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LostItem'
  }],
  foundItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoundItem'
  }],
  claimedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoundItem'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Match user entered password to hashed password in database
lostFoundUserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
lostFoundUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const LostFoundUser = mongoose.model('LostFoundUser', lostFoundUserSchema);

export default LostFoundUser; 