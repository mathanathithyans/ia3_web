# PROJECT REPORT

## ADAPTIVE ONLINE QUIZ AND PERFORMANCE ANALYTICS SYSTEM

**Course Code & Name:** 23CS2048 – Web Technology  
**Evaluation:** III IA (IA3) Skill-Based Evaluation  
**Department:** Computer Science and Engineering  
**Institution:** Karunya Institute of Technology and Sciences, Coimbatore  
**Academic Year:** 2025–2026 (Odd Semester)  

---

## 1. ABSTRACT
Traditional online assessment systems typically present a static set of questions to every student, irrespective of individual proficiency. This often results in beginner students feeling demotivated by excessively challenging questions, while advanced students remain unengaged by basic questions. 

To solve this limitation, this project introduces the **Adaptive Online Quiz and Performance Analytics System**, a full-stack web application designed and built with **Node.js, Express.js, MongoDB, and Bootstrap 5**. The application implements an adaptive testing algorithm where the difficulty of subsequent questions is dynamically adjusted based on the student's real-time responses:
- Answering correctly elevates the difficulty level (`Easy` ➔ `Medium` ➔ `Hard`).
- Answering incorrectly reduces the difficulty level (`Hard` ➔ `Medium` ➔ `Easy`).

Upon completing the test session, the student's attempt details are securely persisted in a MongoDB database. The system provides immediate feedback and longitudinal performance analytics, visualizing score progression, accuracy, and difficulty distributions through interactive Chart.js visualizations.

---

## 2. OBJECTIVES & PROBLEM STATEMENT

### 2.1 Problem Statement
Standard web-based quizzes present fixed question orders and static difficulty curves, failing to accurately reflect a learner's true competence. Moreover, most simple quiz systems lack granular performance analytics, preventing students and educators from identifying specific knowledge gaps.

### 2.2 Objectives
1. **Adaptive Testing Engine:** Develop an algorithm that evaluates student answers in real time and adjusts subsequent question difficulty dynamically.
2. **Robust Input Validation:** Implement comprehensive client-side and server-side validation to ensure clean, sanitised inputs and reliable data integrity.
3. **Full-Stack Integration:** Connect an asynchronous Node.js/Express backend with a NoSQL MongoDB database using Mongoose ODM to perform full CRUD operations.
4. **Performance Analytics Dashboard:** Provide visual analytics using Chart.js to track accuracy, score trends, and difficulty mastery over multiple quiz attempts.
5. **Question Bank Management:** Enable instructors to add, view, and delete questions categorized by difficulty and subject area.

---

## 3. SYSTEM ARCHITECTURE

The application follows the classic **Three-Tier Architecture** (Presentation Tier, Application Tier, and Data Tier):

```
+-------------------------------------------------------------------------+
|                         PRESENTATION TIER (Frontend)                   |
|   - HTML5 / CSS3 / Bootstrap 5 (Responsive Layout & Component Cards)    |
|   - Vanilla JavaScript (DOM Manipulation, State Management, Fetch API)  |
|   - Chart.js (Visual Performance Analytics Graphs)                      |
+-------------------------------------------------------------------------+
                                    |
                          HTTP / REST API (JSON)
                                    |
+-------------------------------------------------------------------------+
|                         APPLICATION TIER (Backend)                      |
|   - Node.js Runtime Environment                                         |
|   - Express.js Framework (Routing, Middleware, Validation)              |
|   - Adaptive Decision Algorithm & Score Computation Engine              |
+-------------------------------------------------------------------------+
                                    |
                              Mongoose ODM
                                    |
+-------------------------------------------------------------------------+
|                            DATA TIER (Database)                         |
|   - MongoDB Server (NoSQL Document Store)                               |
|   - Collections: students, questions, quizresults                       |
+-------------------------------------------------------------------------+
```

---

## 4. TECHNOLOGIES USED

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | Bootstrap 5.3.0 | Responsive grid, cards, forms, navigation bar, and color-coded badges |
| **Scripting Language** | Vanilla JavaScript (ES6+) | Event listeners, client validation, asynchronous `fetch()` API calls |
| **Data Visualization** | Chart.js 4.x | Renders multi-dataset bar charts for historical quiz attempts |
| **Backend Runtime** | Node.js (LTS v20+) | Event-driven, non-blocking I/O execution environment |
| **Web Server Framework** | Express.js 5.x | REST API routing, request parsing, and static asset serving |
| **Database** | MongoDB Server | Document-oriented database for storing JSON-like records |
| **Object Data Modeling** | Mongoose 9.x | Strict schema definition, validation, and database queries |

---

## 5. DATABASE DESIGN & SCHEMAS

The database `adaptive_quiz_db` consists of three primary collections:

### 5.1 Student Schema (`students`)
Stores basic registered student credentials for tracking quiz attempts.
- `name` (String, Required): Student's full name.
- `regNo` (String, Required): Unique college register number (e.g. `URK23CS1001`).
- `email` (String, Required, Unique): Lowercase, validated email address.
- `department` (String, Default: `B.Tech CSE`): Student department.
- `createdAt` (Date, Default: Current timestamp).

### 5.2 Question Schema (`questions`)
Stores question items classified by subject category and difficulty level.
- `questionText` (String, Required): The question prompt.
- `difficulty` (String, Enum: `['Easy', 'Medium', 'Hard']`): Difficulty tier.
- `options` (Array of 4 Strings, Required): Four multiple-choice answers.
- `correctIndex` (Number, Range: 0 to 3): Index of the correct answer in the options array.
- `category` (String, Default: `Web Technology`): Subject topic.

### 5.3 QuizResult Schema (`quizresults`)
Persists the final results of each completed 5-question adaptive quiz.
- `studentName` (String): Candidate name.
- `regNo` (String): Candidate register number.
- `email` (String): Candidate email address.
- `score` (Number): Total weighted score accumulated.
- `totalQuestions` (Number): Total questions in the session (5).
- `correctAnswers` (Number): Number of correctly answered questions.
- `accuracy` (Number): Percentage of correct answers.
- `easyCount`, `mediumCount`, `hardCount` (Numbers): Distribution of attempted difficulties.
- `details` (Array of Objects): Snapshot of each question attempted, chosen option, correct option, and pass/fail status.
- `date` (Date): Completion timestamp.

---

## 6. INPUT VALIDATION MECHANISMS

Input validation is rigorously enforced at two independent layers:

### 6.1 Client-Side Validation (Browser)
1. **Registration Form:**
   - Full Name must contain at least 2 characters.
   - Register Number must be non-empty and at least 3 characters.
   - Email format is validated using regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
2. **Quiz Option Selection:**
   - Prevents form submission if none of the radio buttons are selected, displaying a localized warning without reloading the page.
3. **Question Bank Entry:**
   - Validates that the question text has $\ge 5$ characters and all four distinct options are filled before sending a `POST` request.

### 6.2 Server-Side Validation (Express.js)
1. Checks that all required payload fields exist and are of appropriate types.
2. Returns standard HTTP status codes:
   - `400 Bad Request`: When required fields are missing, empty, or fail regex verification.
   - `404 Not Found`: When an invalid question ID or nonexistent email is requested.
   - `500 Internal Server Error`: For database or unexpected server errors.

---

## 7. ADAPTIVE QUIZ ALGORITHM IMPLEMENTATION

The core adaptive engine follows a calibrated branching logic:
1. **Initialization:** Every quiz session starts at **Medium** difficulty.
2. **Scoring Weightage:**
   - Easy Question = **10 points**
   - Medium Question = **20 points**
   - Hard Question = **30 points**
3. **Dynamic Difficulty Adjustment:**
   - If the student selects the **correct** answer:
     - Current is `Easy` ➔ Next is `Medium`
     - Current is `Medium` ➔ Next is `Hard`
     - Current is `Hard` ➔ Next remains `Hard`
   - If the student selects an **incorrect** answer:
     - Current is `Hard` ➔ Next drops to `Medium`
     - Current is `Medium` ➔ Next drops to `Easy`
     - Current is `Easy` ➔ Next remains `Easy`
4. **Non-Repeating Constraint:** The server maintains an array of already-attempted question IDs (`exclude` parameter) to ensure a question is never presented twice in the same session.

---

## 8. TEST CASES AND VERIFICATION

| Test Case ID | Test Description | Input Data | Expected Output | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Student registration with valid data | Name: `Rahul Sharma`, RegNo: `URK23CS1001`, Email: `rahul@karunya.edu` | Student saved in MongoDB, quiz session starts | **PASSED** |
| **TC-02** | Registration with invalid email format | Name: `Test`, RegNo: `123`, Email: `notanemail` | Error message: "Please enter a valid email address", HTTP 400 | **PASSED** |
| **TC-03** | Submitting quiz question without choosing option | No radio selected | UI alert: "Please choose one of the options before continuing" | **PASSED** |
| **TC-04** | Adaptive upgrade on correct answer | Medium question answered correctly | Difficulty advances to `Hard`, +20 points awarded | **PASSED** |
| **TC-05** | Adaptive downgrade on wrong answer | Hard question answered incorrectly | Difficulty reduces to `Medium`, 0 points awarded | **PASSED** |
| **TC-06** | Quiz result persistence | 5 questions completed | Result record inserted into `quizresults` collection | **PASSED** |
| **TC-07** | Student analytics retrieval | Search email: `rahul@karunya.edu` | Displays total attempts, best score, and renders Chart.js chart | **PASSED** |
| **TC-08** | Question bank addition | Add new question with 4 options | Question inserted into MongoDB and visible in table | **PASSED** |

---

## 9. CONCLUSION & FUTURE SCOPE

### 9.1 Conclusion
The **Adaptive Online Quiz and Performance Analytics System** successfully fulfills all evaluation criteria specified in the 23CS2048 Web Technology IA3 Rubric:
- Well-structured responsive design using Bootstrap 5.
- Comprehensive client-side and server-side input validation.
- Complete frontend and backend integration utilizing Node.js, Express, and MongoDB.
- Dynamic adaptive quiz logic and visual analytics using Chart.js.

### 9.2 Future Scope
- Implementation of JWT (JSON Web Tokens) authentication for protected administrative views.
- Automatic timer countdown per question with timed auto-submission.
- Exporting student performance transcripts as downloadable PDF reports.

