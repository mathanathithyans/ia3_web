# VIVA VOCE QUESTIONS & ANSWERS
## 23CS2048 - Web Technology (III IA / IA3)
### Project: Adaptive Online Quiz and Performance Analytics System

---

### Q1. What is the architecture of your project?
**Answer:**  
Our project follows the standard **Three-Tier Architecture**:
1. **Presentation Tier (Client):** Developed using HTML5, CSS3, Bootstrap 5 for responsiveness, and vanilla JavaScript for DOM events and fetch API calls. Visual graphs are rendered using Chart.js.
2. **Application Tier (Server):** Developed using Node.js and the Express.js framework to handle routing, REST APIs, adaptive logic, and request validation.
3. **Data Tier (Database):** MongoDB database running locally, interacted with through the Mongoose Object Data Modeling (ODM) library.

---

### Q2. What makes your quiz system "Adaptive"?
**Answer:**  
Unlike traditional quizzes where all students receive the exact same sequence of questions, our system dynamically adjusts difficulty based on the student's real-time performance:
- The quiz begins at **Medium** difficulty.
- When a student answers **correctly**, the system increases difficulty to **Hard** and awards higher points (30 pts).
- When a student answers **incorrectly**, the system lowers difficulty to **Medium** or **Easy** (10 pts).
- This adapts to the learner's knowledge level and provides an accurate measure of their understanding.

---

### Q3. How did you implement Input Validation (Rubric Criteria 2)?
**Answer:**  
We implemented two independent layers of validation:
1. **Client-Side Validation:**
   - In HTML and JavaScript, we check that inputs are not blank, names have at least 2 characters, register numbers meet length criteria, and emails match a standard regular expression format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
   - We prevent quiz question submission if no radio button option is selected.
2. **Server-Side Validation:**
   - In `server.js`, Express checks every incoming request body. If any required field is invalid or missing, it rejects the request with HTTP Status Code `400 Bad Request` and a descriptive JSON error message.

---

### Q4. What is Node.js and why did you choose it over Apache/PHP?
**Answer:**  
Node.js is an open-source, cross-platform JavaScript runtime environment built on Chrome's V8 JavaScript engine. It uses an **event-driven, non-blocking I/O model**, making it lightweight and highly efficient for data-intensive real-time applications like interactive quizzes and RESTful APIs. It also allows using JavaScript on both client and server sides.

---

### Q5. What is Express.js and what role does it play?
**Answer:**  
Express.js is a minimal and flexible web application framework for Node.js. In our project, it:
1. Serves static files (HTML, CSS, JS) from the `public` folder using `express.static()`.
2. Parses incoming JSON request payloads using `express.json()`.
3. Defines REST API endpoints (`/api/students/register`, `/api/quiz/get-question`, `/api/quiz/check-answer`, `/api/quiz/save-result`, `/api/analytics/...`).

---

### Q6. What is MongoDB and how does it store data?
**Answer:**  
MongoDB is a NoSQL, document-oriented database. Instead of storing data in rigid rows and columns like relational databases (MySQL), MongoDB stores data in flexible, JSON-like format known as **BSON (Binary JSON)**. Documents with similar structure are grouped into Collections.

---

### Q7. What is Mongoose and why is it used?
**Answer:**  
Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It manages relationships between data, provides schema validation, and translates between objects in code and the representation of those objects in MongoDB. In our project, we have defined schemas for `Student`, `Question`, and `QuizResult`.

---

### Q8. What is the difference between SQL and NoSQL databases?
**Answer:**  
- **SQL (Relational):** Data is stored in tables with fixed schemas and predefined relationships. Examples: MySQL, PostgreSQL.
- **NoSQL (Non-Relational):** Data is stored in flexible documents, key-value pairs, or graphs without requiring a fixed schema. Examples: MongoDB, Cassandra. MongoDB is ideal for rapid development and handling hierarchical data like quiz answers and question options.

---

### Q9. How do you prevent a student from seeing the same question twice in one quiz?
**Answer:**  
During the quiz session, the client JavaScript maintains an array of attempted question IDs (`attemptedQuestionIds`). When requesting the next question, these IDs are sent as a query parameter (`exclude=id1,id2...`). The server then uses MongoDB's `$nin` (not in) query operator:
```javascript
Question.find({ difficulty: difficulty, _id: { $nin: excludeIds } });
```

---

### Q10. How does the frontend communicate with the backend?
**Answer:**  
The frontend uses the modern JavaScript native **`fetch()` API** to make asynchronous HTTP requests (`GET`, `POST`, `DELETE`) to the Express endpoints. Data is exchanged in JSON format. The response updates the Document Object Model (DOM) dynamically without refreshing the page.

---

### Q11. What is Chart.js and how is it used in the Analytics section?
**Answer:**  
Chart.js is an open-source HTML5 canvas-based JavaScript library for data visualization. In our project, when a student queries their email in the Student Analytics tab, the server retrieves all their past attempts from MongoDB. Chart.js then renders a dual-dataset bar chart plotting **Score (Points)** and **Accuracy (%)** across each attempt.

---

### Q12. What HTTP status codes are used in your application?
**Answer:**  
- **200 OK:** Successful request and data returned.
- **400 Bad Request:** Validation error (e.g. invalid email or missing option).
- **404 Not Found:** Resource not found (e.g. no questions available).
- **500 Internal Server Error:** Unexpected server-side or database exception.

