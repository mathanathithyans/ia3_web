const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please enter a valid email address'
    ]
  },
  regNo: {
    type: String,
    required: [true, 'Register Number is required'],
    trim: true,
    uppercase: true,
    minlength: [4, 'Register Number must be at least 4 characters'],
    maxlength: [20, 'Register Number cannot exceed 20 characters']
  },
  department: {
    type: String,
    default: 'Computer Science and Engineering',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index or unique index for quick lookup
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
