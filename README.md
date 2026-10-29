# Adaptive Online Quiz and Performance Analytics System

**Course Code:** 23CS2048 - Web Technology  
**Evaluation:** III IA (IA3) Skill-Based Evaluation  
**Institution:** Karunya Institute of Technology and Sciences  

---

## 📌 Project Overview
The **Adaptive Online Quiz and Performance Analytics System** is a full-stack web application developed using **Node.js, Express.js, MongoDB, and Bootstrap 5**. 

Unlike conventional static quizzes, this system dynamically adjusts question difficulty in real time based on the student's performance:
- A correct answer increases the difficulty level (**Easy ➔ Medium ➔ Hard**).
- An incorrect answer decreases the difficulty level (**Hard ➔ Medium ➔ Easy**).

The system records student performance in MongoDB and provides detailed analytics including score distribution, accuracy rates, question-by-question breakdown, and interactive visual charts using Chart.js.

---

## 📋 Evaluation Rubrics Coverage (20 Marks Total)

| Rubric Criteria | Maximum Marks | Implementation in this Project |
| :--- | :---: | :--- |
| **1. Design of Website** | **4** | Complete, responsive UI built with **Bootstrap 5** cards, tables, badges, and clean custom CSS. Clear 4-tab layout (Take Quiz, Analytics, Leaderboard, Question Bank). |
| **2. Input Validation** | **4** | **Dual validation**: Client-side validation (HTML5 + JS regex for email, minimum lengths, radio option selection) and Server-side Express validation with HTTP 400 Bad Request error handlers. |
| **3. Front-End & Back-End Integration** | **4** | Effective integration using **Node.js/Express.js REST APIs** connected to **MongoDB** via **Mongoose**. Dynamic data retrieval and storage using native `fetch()` API. |
| **4. Presentation & Viva** | **4** | Clean, readable, well-commented student-grade code (no over-engineering). Comprehensive viva Q&A provided in `VIVA_QUESTIONS_AND_ANSWERS.md`. |
| **5. GitHub Repository & Report** | **4** | Complete academic project report in `PROJECT_REPORT.md` and clean Git repository setup instructions below. |

---

## 🚀 Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Chart.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Environment & Configuration:** `dotenv`, `cors`

---

## 📁 Project Directory Structure
```text
new ia3 wt/
├── models/
│   ├── Student.js          # Student registration schema
│   ├── Question.js         # Question bank schema (Easy, Medium, Hard)
│   └── QuizResult.js       # Quiz attempt and analytics schema
├── public/
│   ├── css/
│   │   └── style.css       # Clean academic UI styling
│   ├── js/
│   │   └── script.js       # Client logic: API calls, validation, Chart.js
│   └── index.html          # Single-page web application UI
├── .env                    # Environment configuration (PORT, MONGO_URI)
├── .gitignore              # Ignored files for Git repository
├── package.json            # Node.js dependencies and scripts
├── PROJECT_REPORT.md       # Complete academic project report
├── README.md               # Project documentation
├── seed.js                 # Sample Web Technology question bank seeder
├── server.js               # Express server and REST API endpoints
└── VIVA_QUESTIONS_AND_ANSWERS.md  # Viva preparation guide
```

---

## ⚙️ How to Setup and Run the Project

### Prerequisites:
1. **Node.js** installed (v16 or higher). Check using:
   ```powershell
   node -v
   ```
2. **MongoDB** installed and running on default port `27017`.

---

### Step 1: Install Dependencies
Open PowerShell or Terminal in the project root directory and run:
```powershell
npm install
```

### Step 2: Seed Sample Questions into MongoDB
Pre-populate the database with 15 verified Web Technology questions (5 Easy, 5 Medium, 5 Hard):
```powershell
npm run seed
```
*Expected Output: `Successfully seeded 15 questions into MongoDB!`*

### Step 3: Start the Application
Run:
```powershell
npm start
```
*Expected Output:*
```text
Server running at http://localhost:3000
Connected to MongoDB: mongodb://127.0.0.1:27017/adaptive_quiz_db
```

### Step 4: Open in Web Browser
Open your browser and navigate to:
```text
http://localhost:3000
```

---

## 🧪 Testing the Project Features

### 1. Test Input Validation:
- Go to **Student Registration**. Try submitting with empty fields or an invalid email (`test@abc`). The system blocks submission and highlights the invalid field.
- In the quiz, try clicking **Submit & Next** without selecting an option. A warning message prompts you to choose an answer.

### 2. Test the Adaptive Algorithm:
- Question 1 begins at **Medium** difficulty.
- Select the **correct answer** ➔ The badge turns to **Hard** (Red badge) and awards 30 points.
- Select an **incorrect answer** ➔ The badge drops to **Medium** (Yellow badge) or **Easy** (Green badge).

### 3. Test Performance Analytics & Charts:
- After answering 5 questions, view the instant results table.
- Switch to the **Student Analytics** tab and search by your email (e.g. `rahul@karunya.edu`).
- View total attempts, highest score, average accuracy, and the interactive **Chart.js** bar chart.

### 4. Test Question Bank (CRUD):
- Go to the **Question Bank** tab to add a new custom question or delete an existing one.

---

## 📤 Pushing to GitHub (For Rubric Criteria 5)

Run the following commands in the project folder to create and push your GitHub repository:
```powershell
git init
git add .
git commit -m "Initial commit: Adaptive Online Quiz and Performance Analytics System"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/adaptive-quiz-system.git
git push -u origin main
```
