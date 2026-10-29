const mongoose = require('mongoose');

// QuizResult Schema to store performance analytics in MongoDB
const quizResultSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  regNo: { type: String, required: true },
  email: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  accuracy: { type: Number, required: true }, // percentage
  easyCount: { type: Number, default: 0 },
  mediumCount: { type: Number, default: 0 },
  hardCount: { type: Number, default: 0 },
  details: [
    {
      questionText: String,
      difficulty: String,
      selectedOption: String,
      correctOption: String,
      isCorrect: Boolean
    }
  ],
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
