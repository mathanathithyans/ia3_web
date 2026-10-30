const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// ========================================================
// 3. DUAL-MODE DATABASE (MongoDB with JSON File Fallback)
// ========================================================
let isConnected = false;
let dbMode = 'mongodb'; // 'mongodb' or 'json'
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(fileName) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (e) {
    return [];
  }
}

function writeJsonFile(fileName, data) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing JSON file:', e.message);
  }
}

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    dbMode = 'mongodb';
    return;
  }
  try {
    const db = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false
    });
    isConnected = db.connections[0].readyState === 1;
    dbMode = 'mongodb';
    console.log('Connected to MongoDB Atlas successfully [Mode: mongodb]');
  } catch (err) {
    console.warn('Atlas connection failed. Trying local MongoDB...');
    if (!process.env.VERCEL) {
      try {
        const localDb = await mongoose.connect('mongodb://127.0.0.1:27017/adaptive_quiz_db', {
          serverSelectionTimeoutMS: 2000
        });
        isConnected = localDb.connections[0].readyState === 1;
        dbMode = 'mongodb';
        console.log('Connected to Local MongoDB fallback [Mode: mongodb]');
        return;
      } catch (localErr) {
        // Fallback to JSON Mode
      }
    }
    // Switch to JSON File Store Dual-Mode
    dbMode = 'json';
    console.log('⚡ DUAL-MODE ACTIVE: MongoDB unavailable, switched to JSON File Store [Mode: json]');
  }
}

// Middleware ensuring DB connection attempt before handling /api calls
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    await connectDB();
  }
  next();
});

// Trigger connection on startup
connectDB().catch(err => console.log('Initial DB check:', err.message));

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

    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      let student = await Student.findOne({ email: cleanEmail });
      if (!student) {
        student = new Student({ name: cleanName, regNo: cleanRegNo, email: cleanEmail });
        await student.save();
      } else {
        student.name = cleanName;
        student.regNo = cleanRegNo;
        await student.save();
      }
      return res.json({ success: true, student, dbMode: 'mongodb' });
    } else {
      // JSON File Fallback
      let students = readJsonFile('students.json');
      let student = students.find(s => s.email === cleanEmail);
      if (!student) {
        student = { _id: 'std_' + Date.now(), name: cleanName, regNo: cleanRegNo, email: cleanEmail, department: 'B.Tech CSE' };
        students.push(student);
      } else {
        student.name = cleanName;
        student.regNo = cleanRegNo;
      }
      writeJsonFile('students.json', students);
      return res.json({ success: true, student, dbMode: 'json' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error during registration: ' + error.message });
  }
});

// ==========================================
// 2. ADAPTIVE QUIZ ENGINE
// ==========================================

// Get next question adaptively based on difficulty
// FEATURE: ITEM MASKING - Correct answers are stripped before sending to the client!
app.get('/api/quiz/get-question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty || 'Medium';
    const excludeIdsStr = req.query.exclude || '';
    const excludeIds = excludeIdsStr ? excludeIdsStr.split(',').filter(id => id) : [];

    let chosen = null;

    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      let filter = {
        difficulty: difficulty,
        _id: { $nin: excludeIds }
      };

      let questions = await Question.find(filter);
      if (questions.length === 0) {
        questions = await Question.find({ _id: { $nin: excludeIds } });
      }

      if (questions.length === 0) {
        return res.status(404).json({ error: 'No more questions available in the question bank.' });
      }

      const randomIndex = Math.floor(Math.random() * questions.length);
      chosen = questions[randomIndex];
    } else {
      // JSON File Fallback
      let questions = readJsonFile('questions.json');
      let filtered = questions.filter(q => q.difficulty === difficulty && !excludeIds.includes(String(q._id)));
      if (filtered.length === 0) {
        filtered = questions.filter(q => !excludeIds.includes(String(q._id)));
      }
      if (filtered.length === 0) {
        return res.status(404).json({ error: 'No more questions available in the question bank.' });
      }
      chosen = filtered[Math.floor(Math.random() * filtered.length)];
    }

    // =========================================================================
    // ITEM MASKING LOGIC:
    // Notice correctIndex is purposefully REMOVED from the returned payload
    // so scoring cannot be changed or inspected from browser DevTools!
    // =========================================================================
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

    let question = null;

    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      question = await Question.findById(questionId);
    } else {
      const questions = readJsonFile('questions.json');
      question = questions.find(q => String(q._id) === String(questionId));
    }

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

// Save complete quiz result to MongoDB or JSON Store
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
      tabSwitchCount,
      details
    } = req.body;

    if (!studentName || !regNo || !email) {
      return res.status(400).json({ error: 'Student information missing.' });
    }

    const resultData = {
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
      tabSwitchCount: tabSwitchCount || 0,
      details: details || [],
      date: new Date()
    };

    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      const result = new QuizResult(resultData);
      await result.save();
      return res.json({ success: true, result, dbMode: 'mongodb' });
    } else {
      const results = readJsonFile('results.json');
      resultData._id = 'res_' + Date.now();
      results.push(resultData);
      writeJsonFile('results.json', results);
      return res.json({ success: true, result: resultData, dbMode: 'json' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error saving quiz result: ' + error.message });
  }
});

// ==========================================
// 4. PERFORMANCE ANALYTICS
// ==========================================

// Get analytics for a specific student
app.get('/api/analytics/student/:email', async (req, res) => {
  try {
    const email = req.params.email.trim().toLowerCase();
    let history = [];

    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      history = await QuizResult.find({ email }).sort({ date: -1 });
    } else {
      const allResults = readJsonFile('results.json');
      history = allResults.filter(r => r.email === email).sort((a,b) => new Date(b.date) - new Date(a.date));
    }

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
    let topScores = [];
    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      topScores = await QuizResult.find({})
        .sort({ score: -1, accuracy: -1 })
        .limit(5)
        .select('studentName regNo score accuracy date tabSwitchCount');
    } else {
      const allResults = readJsonFile('results.json');
      topScores = allResults
        .sort((a, b) => b.score - a.score || b.accuracy - a.accuracy)
        .slice(0, 5);
    }
    res.json(topScores);
  } catch (error) {
    res.status(500).json({ error: 'Error loading leaderboard: ' + error.message });
  }
});

// ==========================================
// 5. QUESTION BANK MANAGEMENT (CRUD)
// ==========================================
app.get('/api/questions', async (req, res) => {
  try {
    let questions = [];
    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      questions = await Question.find({}).sort({ difficulty: 1 });
    } else {
      questions = readJsonFile('questions.json');
    }
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Error loading questions: ' + error.message });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const { questionText, difficulty, option0, option1, option2, option3, correctIndex, category } = req.body;

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

    const questionObj = {
      questionText: questionText.trim(),
      difficulty,
      options: [option0.trim(), option1.trim(), option2.trim(), option3.trim()],
      correctIndex: cIndex,
      category: category ? category.trim() : 'Web Technology'
    };

    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      const newQuestion = new Question(questionObj);
      await newQuestion.save();
      return res.json({ success: true, question: newQuestion });
    } else {
      const questions = readJsonFile('questions.json');
      questionObj._id = 'q_' + Date.now();
      questions.push(questionObj);
      writeJsonFile('questions.json', questions);
      return res.json({ success: true, question: questionObj });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error creating question: ' + error.message });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  try {
    if (dbMode === 'mongodb' && mongoose.connection.readyState === 1) {
      await Question.findByIdAndDelete(req.params.id);
    } else {
      let questions = readJsonFile('questions.json');
      questions = questions.filter(q => String(q._id) !== String(req.params.id));
      writeJsonFile('questions.json', questions);
    }
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
