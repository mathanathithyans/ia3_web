const mongoose = require('mongoose');

// Question Schema for Question Bank
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  options: {
    type: [String],
    required: true,
    validate: [arr => arr.length === 4, 'Must have exactly 4 options']
  },
  correctIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  category: {
    type: String,
    default: 'Web Technology'
  }
});

module.exports = mongoose.model('Question', questionSchema);
