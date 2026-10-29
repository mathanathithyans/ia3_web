const mongoose = require('mongoose');

// Student Schema for Registration & Identification
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student Name is required'],
    trim: true
  },
  regNo: {
    type: String,
    required: [true, 'Register Number is required'],
    trim: true,
    uppercase: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    default: 'B.Tech CSE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Student', studentSchema);

