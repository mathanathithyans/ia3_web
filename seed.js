require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./models/Question');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adaptive_quiz_db';

const sampleQuestions = [
  // --- EASY QUESTIONS ---
  {
    questionText: 'Which HTML tag is used to define an internal stylesheet?',
    difficulty: 'Easy',
    options: ['<script>', '<style>', '<css>', '<stylesheet>'],
    correctIndex: 1,
    category: 'HTML/CSS'
  },
  {
    questionText: 'Which CSS property is used to change the text color of an element?',
    difficulty: 'Easy',
    options: ['text-color', 'font-color', 'color', 'background-color'],
    correctIndex: 2,
    category: 'HTML/CSS'
  },
  {
    questionText: 'Which keyword is used to declare a constant variable in JavaScript?',
    difficulty: 'Easy',
    options: ['var', 'let', 'constant', 'const'],
    correctIndex: 3,
    category: 'JavaScript'
  },
  {
    questionText: 'What does HTML stand for?',
    difficulty: 'Easy',
    options: [
      'Hyper Text Markup Language',
      'High Text Main Language',
      'Hyperlinks and Text Markup Language',
      'Home Tool Markup Language'
    ],
    correctIndex: 0,
    category: 'HTML/CSS'
  },
  {
    questionText: 'Which HTTP method is typically used to request data from a server?',
    difficulty: 'Easy',
    options: ['POST', 'GET', 'PUT', 'DELETE'],
    correctIndex: 1,
    category: 'General Web'
  },

  // --- MEDIUM QUESTIONS ---
  {
    questionText: 'In the CSS Box Model, which layer is positioned between padding and margin?',
    difficulty: 'Medium',
    options: ['Content', 'Border', 'Outline', 'Spacing'],
    correctIndex: 1,
    category: 'HTML/CSS'
  },
  {
    questionText: 'Which built-in Node.js module is used to create an HTTP server?',
    difficulty: 'Medium',
    options: ['fs', 'url', 'http', 'net'],
    correctIndex: 2,
    category: 'Node.js'
  },
  {
    questionText: 'What is the format used by MongoDB to store documents internally?',
    difficulty: 'Medium',
    options: ['JSON', 'BSON (Binary JSON)', 'XML', 'YAML'],
    correctIndex: 1,
    category: 'MongoDB'
  },
  {
    questionText: 'What will "2" + 2 evaluate to in JavaScript?',
    difficulty: 'Medium',
    options: ['4', '"22"', 'NaN', 'Error'],
    correctIndex: 1,
    category: 'JavaScript'
  },
  {
    questionText: 'In Express.js, what does the "next()" function do in a middleware?',
    difficulty: 'Medium',
    options: [
      'Terminates the request-response cycle',
      'Passes control to the next middleware function',
      'Restarts the Express application',
      'Sends an error response automatically'
    ],
    correctIndex: 1,
    category: 'Node.js'
  },

  // --- HARD QUESTIONS ---
  {
    questionText: 'What is a JavaScript Closure?',
    difficulty: 'Hard',
    options: [
      'A method to terminate an infinite loop',
      'A function bundled together with references to its lexical environment',
      'A way to close an active MongoDB connection',
      'A callback passed into setTimeout'
    ],
    correctIndex: 1,
    category: 'JavaScript'
  },
  {
    questionText: 'Which HTTP status code signifies "401 Unauthorized" vs "403 Forbidden"?',
    difficulty: 'Hard',
    options: [
      '401 means authentication is needed; 403 means authenticated but access is not granted',
      '401 means server error; 403 means file not found',
      '401 and 403 are identical and used interchangeably',
      '401 is used for GET requests; 403 is used for POST requests'
    ],
    correctIndex: 0,
    category: 'General Web'
  },
  {
    questionText: 'How does Node.js handle non-blocking asynchronous I/O operations under the hood?',
    difficulty: 'Hard',
    options: [
      'By spawning a new operating system thread for every single HTTP request',
      'Using the libuv event loop and thread pool',
      'By converting all JavaScript code into C++ at runtime',
      'By using blocking system calls synchronously'
    ],
    correctIndex: 1,
    category: 'Node.js'
  },
  {
    questionText: 'In MongoDB, which aggregation stage is used to group documents by a specified identifier?',
    difficulty: 'Hard',
    options: ['$project', '$match', '$group', '$unwind'],
    correctIndex: 2,
    category: 'MongoDB'
  },
  {
    questionText: 'What will be logged: console.log(typeof NaN)?',
    difficulty: 'Hard',
    options: ['"undefined"', '"nan"', '"object"', '"number"'],
    correctIndex: 3,
    category: 'JavaScript'
  }
];

async function seedDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');
    await Question.deleteMany({});
    console.log('Cleared old questions.');
    await Question.insertMany(sampleQuestions);
    console.log(`Successfully seeded ${sampleQuestions.length} questions into MongoDB!`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDB();

