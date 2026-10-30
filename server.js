const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const Student = require('./models/Student');
const Question = require('./models/Question');
const QuizResult = require('./models/QuizResult');

const app = express();
const PORT = process.env.PORT || 3000;
const ATLAS_URI = 'mongodb+srv://mathanathithyan_db_user:v2ocjxj4k5TW9MvH@cluster0.icw2tf9.mongodb.net/adaptive_quiz_db?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_URI = process.env.MONGO_URI || ATLAS_URI;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Cached MongoDB Connection for Serverless (Vercel) & Local
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('Connected to MongoDB Atlas successfully');
  } catch (err) {
    console.warn('Atlas connection error:', err.message);
    // If running locally on laptop, try local MongoDB fallback
    if (!process.env.VERCEL) {
      try {
        const localDb = await mongoose.connect('mongodb://127.0.0.1:27017/adaptive_quiz_db', {
          serverSelectionTimeoutMS: 3000
        });
        isConnected = localDb.connections[0].readyState === 1;
        console.log('Connected to Local MongoDB fallback');
        return;
      } catch (localErr) {
        // ignore
      }
    }
    throw new Error('Database connection failed: ' + err.message);
  }
}

// Middleware to ensure DB connection is ready before processing API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(500).json({
        error: 'Database connection failed. In MongoDB Atlas, go to Network Access and add 0.0.0.0/0 (Allow Access from Anywhere).'
      });
    }
  }
  next();
});

// Trigger connection on startup
connectDB().catch(err => console.log('Initial DB connection attempt:', err.message));

// ==========================================
// 1. STUDENT REGISTRATION & INPUT VALIDATION
// ==========================================
app.post('/api/students/register', async (req, res) => {
  try {
    const { name, regNo, email } = req.body;

    // Server-Side Input Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!regNo || regNo.trim().length < 3) {
      return res.status(400).json({ error: 'Valid Register Number is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRegNo = regNo.trim().toUpperCase();
    const cleanName = name.trim();

    // Check if student already registered, otherwise create new
    let student = await Student.findOne({ email: cleanEmail });
    if (!student) {
      student = new Student({
        name: cleanName,
        regNo: cleanRegNo,
        email: cleanEmail
      });
      await student.save();
    } else {
      student.name = cleanName;
      student.regNo = cleanRegNo;
      await student.save();
    }

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ error: 'Error during registration: ' + error.message });
  }
});

// ==========================================
// 2. ADAPTIVE QUIZ ENGINE
// ==========================================

// Get next question adaptively based on difficulty
app.get('/api/quiz/get-question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty || 'Medium';
    const excludeIdsStr = req.query.exclude || '';
    const excludeIds = excludeIdsStr ? excludeIdsStr.split(',').filter(id => id) : [];

    // Filter questions by difficulty and exclude previously attempted ones
    let filter = {
      difficulty: difficulty,
      _id: { $nin: excludeIds }
    };

    let questions = await Question.find(filter);

    // Fallback if no questions left in this specific difficulty
    if (questions.length === 0) {
      questions = await Question.find({ _id: { $nin: excludeIds } });
    }

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No more questions available in the question bank.' });
    }

    // Pick a random question from available list
    const randomIndex = Math.floor(Math.random() * questions.length);
    const chosen = questions[randomIndex];

    // Return question without revealing correctIndex to client
    res.json({
      _id: chosen._id,
      questionText: chosen.questionText,
      difficulty: chosen.difficulty,
      options: chosen.options,
      category: chosen.category
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching question: ' + error.message });
  }
});

// Evaluate submitted answer and calculate next adaptive difficulty
app.post('/api/quiz/check-answer', async (req, res) => {
  try {
    const { questionId, selectedIndex, currentDifficulty } = req.body;

    if (!questionId || selectedIndex === undefined || selectedIndex === null) {
      return res.status(400).json({ error: 'questionId and selectedIndex are required.' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    const selectedOptionNum = parseInt(selectedIndex, 10);
    const isCorrect = question.correctIndex === selectedOptionNum;

    // Simple Adaptive Logic:
    // If Correct:  Easy -> Medium -> Hard
    // If Wrong:    Hard -> Medium -> Easy
    let nextDifficulty = currentDifficulty || question.difficulty;

    if (isCorrect) {
      if (currentDifficulty === 'Easy') nextDifficulty = 'Medium';
      else if (currentDifficulty === 'Medium') nextDifficulty = 'Hard';
      else if (currentDifficulty === 'Hard') nextDifficulty = 'Hard';
    } else {
      if (currentDifficulty === 'Hard') nextDifficulty = 'Medium';
      else if (currentDifficulty === 'Medium') nextDifficulty = 'Easy';
      else if (currentDifficulty === 'Easy') nextDifficulty = 'Easy';
    }

    // Points calculation based on difficulty
    let points = 0;
    if (isCorrect) {
      if (question.difficulty === 'Easy') points = 10;
      else if (question.difficulty === 'Medium') points = 20;
      else if (question.difficulty === 'Hard') points = 30;
    }

    res.json({
      isCorrect,
      correctIndex: question.correctIndex,
      correctOptionText: question.options[question.correctIndex],
      selectedOptionText: question.options[selectedOptionNum],
      questionText: question.questionText,
      difficulty: question.difficulty,
      nextDifficulty,
      points
    });
  } catch (error) {
    res.status(500).json({ error: 'Error evaluating answer: ' + error.message });
  }
});

// Save complete quiz result to MongoDB
app.post('/api/quiz/save-result', async (req, res) => {
  try {
    const {
      studentName,
      regNo,
      email,
      score,
      totalQuestions,
      correctAnswers,
      accuracy,
      easyCount,
      mediumCount,
      hardCount,
      details
    } = req.body;

    // Basic validation
    if (!studentName || !regNo || !email) {
      return res.status(400).json({ error: 'Student information missing.' });
    }

    const result = new QuizResult({
      studentName: studentName.trim(),
      regNo: regNo.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
      score: score || 0,
      totalQuestions: totalQuestions || 5,
      correctAnswers: correctAnswers || 0,
      accuracy: accuracy || 0,
      easyCount: easyCount || 0,
      mediumCount: mediumCount || 0,
      hardCount: hardCount || 0,
      details: details || []
    });

    await result.save();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Error saving quiz result: ' + error.message });
  }
});

// ==========================================
// 3. PERFORMANCE ANALYTICS
// ==========================================

// Get analytics for a specific student
app.get('/api/analytics/student/:email', async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    const history = await QuizResult.find({ email }).sort({ date: -1 });

    if (!history || history.length === 0) {
      return res.json({ hasData: false, message: 'No quiz history found.' });
    }

    const totalAttempts = history.length;
    let totalScore = 0;
    let totalAccuracy = 0;
    let bestScore = 0;
    let totalEasy = 0;
    let totalMedium = 0;
    let totalHard = 0;

    history.forEach(item => {
      totalScore += item.score;
      totalAccuracy += item.accuracy;
      if (item.score > bestScore) bestScore = item.score;
      totalEasy += (item.easyCount || 0);
      totalMedium += (item.mediumCount || 0);
      totalHard += (item.hardCount || 0);
    });

    const avgScore = Math.round(totalScore / totalAttempts);
    const avgAccuracy = Math.round(totalAccuracy / totalAttempts);

    res.json({
      hasData: true,
      studentName: history[0].studentName,
      regNo: history[0].regNo,
      email: history[0].email,
      totalAttempts,
      avgScore,
      bestScore,
      avgAccuracy,
      totalEasy,
      totalMedium,
      totalHard,
      history
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching analytics: ' + error.message });
  }
});

// Leaderboard: Top 5 scores
app.get('/api/analytics/leaderboard', async (req, res) => {
  try {
    const topScores = await QuizResult.find({})
      .sort({ score: -1, accuracy: -1 })
      .limit(5)
      .select('studentName regNo score accuracy date');

    res.json(topScores);
  } catch (error) {
    res.status(500).json({ error: 'Error loading leaderboard: ' + error.message });
  }
});

// ==========================================
// 4. QUESTION BANK MANAGEMENT (CRUD)
// ==========================================

// Get all questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find({}).sort({ difficulty: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Error loading questions: ' + error.message });
  }
});

// Add a new question with input validation
app.post('/api/questions', async (req, res) => {
  try {
    const { questionText, difficulty, option0, option1, option2, option3, correctIndex, category } = req.body;

    // Validation
    if (!questionText || questionText.trim().length < 5) {
      return res.status(400).json({ error: 'Question text must be at least 5 characters.' });
    }
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulty must be Easy, Medium, or Hard.' });
    }
    if (!option0 || !option1 || !option2 || !option3) {
      return res.status(400).json({ error: 'All 4 options must be filled.' });
    }
    const cIndex = parseInt(correctIndex, 10);
    if (isNaN(cIndex) || cIndex < 0 || cIndex > 3) {
      return res.status(400).json({ error: 'Correct option index must be between 0 and 3.' });
    }

    const newQuestion = new Question({
      questionText: questionText.trim(),
      difficulty,
      options: [option0.trim(), option1.trim(), option2.trim(), option3.trim()],
      correctIndex: cIndex,
      category: category ? category.trim() : 'Web Technology'
    });

    await newQuestion.save();
    res.json({ success: true, question: newQuestion });
  } catch (error) {
    res.status(500).json({ error: 'Error creating question: ' + error.message });
  }
});

// Delete a question
app.delete('/api/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Question deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting question: ' + error.message });
  }
});

// Start Server locally or export for Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

