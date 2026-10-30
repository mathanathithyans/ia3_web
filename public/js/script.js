// ==========================================
// STATE VARIABLES
// ==========================================
let currentStudent = null;
let currentQuestion = null;
let currentDifficulty = 'Medium';
let currentQuestionNumber = 1;
const TOTAL_QUESTIONS = 5;
let currentScore = 0;
let attemptedQuestionIds = [];
let quizDetails = []; // stores record of each answered question
let myChartInstance = null;

// ==========================================
// NAVIGATION TAB SWITCHER
// ==========================================
function showTab(tabName) {
  const tabs = ['quiz', 'analytics', 'leaderboard', 'questions'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const link = document.getElementById(`tab-${t}-link`);
    if (el && link) {
      if (t === tabName) {
        el.classList.remove('d-none');
        link.classList.add('active');
      } else {
        el.classList.add('d-none');
        link.classList.remove('active');
      }
    }
  });

  if (tabName === 'leaderboard') {
    loadLeaderboard();
  } else if (tabName === 'questions') {
    loadQuestionsList();
  }
}

// ==========================================
// 1. STUDENT REGISTRATION & INPUT VALIDATION
// ==========================================
async function handleRegistration(e) {
  e.preventDefault();

  const nameInput = document.getElementById('student-name');
  const regNoInput = document.getElementById('student-regno');
  const emailInput = document.getElementById('student-email');
  const errorBox = document.getElementById('reg-error');

  errorBox.classList.add('d-none');

  const name = nameInput.value.trim();
  const regNo = regNoInput.value.trim().toUpperCase();
  const email = emailInput.value.trim().toLowerCase();

  // Client-Side Input Validation
  if (name.length < 2) {
    errorBox.textContent = 'Please enter a valid student name (at least 2 characters).';
    errorBox.classList.remove('d-none');
    nameInput.focus();
    return;
  }

  if (regNo.length < 3) {
    errorBox.textContent = 'Please enter a valid Register Number (e.g. URK23CS1001).';
    errorBox.classList.remove('d-none');
    regNoInput.focus();
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errorBox.textContent = 'Please enter a valid email address.';
    errorBox.classList.remove('d-none');
    emailInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/students/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, regNo, email })
    });

    const data = await res.json();
    if (!res.ok) {
      errorBox.textContent = data.error || 'Registration failed.';
      errorBox.classList.remove('d-none');
      return;
    }

    currentStudent = data.student;

    // Show student badge and logout button in top navbar
    const navUserInfo = document.getElementById('nav-user-info');
    const navStudentName = document.getElementById('nav-student-name');
    if (navUserInfo && navStudentName) {
      navStudentName.textContent = `👤 ${data.student.name} (${data.student.regNo})`;
      navUserInfo.classList.remove('d-none');
    }

    // Transition from registration form to quiz view
    document.getElementById('registration-card').classList.add('d-none');
    document.getElementById('quiz-card').classList.remove('d-none');

    // Start Quiz
    startAdaptiveQuiz();

  } catch (err) {
    console.error(err);
    errorBox.textContent = 'Server connection error. Please try again.';
    errorBox.classList.remove('d-none');
  }
}

// ==========================================
// 2. ADAPTIVE QUIZ EXECUTION
// ==========================================
function startAdaptiveQuiz() {
  currentQuestionNumber = 1;
  currentDifficulty = 'Medium';
  currentScore = 0;
  attemptedQuestionIds = [];
  quizDetails = [];

  document.getElementById('current-score').textContent = '0 pts';
  document.getElementById('adaptive-alert').classList.add('d-none');

  loadNextQuestion();
}

async function loadNextQuestion() {
  const quizError = document.getElementById('quiz-error');
  quizError.classList.add('d-none');

  // Update progress UI
  document.getElementById('quiz-progress').textContent = `Question ${currentQuestionNumber} of ${TOTAL_QUESTIONS}`;
  updateDifficultyBadge(currentDifficulty);

  // Clear previous radio selection
  const radios = document.getElementsByName('quizOption');
  radios.forEach(r => r.checked = false);

  try {
    const excludeParam = attemptedQuestionIds.join(',');
    const url = `/api/quiz/get-question?difficulty=${currentDifficulty}&exclude=${excludeParam}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Failed to load question.');
      return;
    }

    currentQuestion = data;
    attemptedQuestionIds.push(data._id);

    // Display question & 4 options
    document.getElementById('question-text').textContent = `${currentQuestionNumber}. ${data.questionText}`;
    for (let i = 0; i < 4; i++) {
      document.getElementById(`opt-${i}-text`).textContent = data.options[i];
    }

  } catch (err) {
    console.error(err);
    alert('Error loading question from server.');
  }
}

function updateDifficultyBadge(diff) {
  const badge = document.getElementById('difficulty-badge');
  badge.textContent = diff;
  badge.className = 'ms-2 badge';
  if (diff === 'Easy') badge.classList.add('badge-easy');
  else if (diff === 'Medium') badge.classList.add('badge-medium');
  else if (diff === 'Hard') badge.classList.add('badge-hard');
}

async function submitAnswer() {
  const quizError = document.getElementById('quiz-error');
  quizError.classList.add('d-none');

  // Input Validation: Check if an option is selected
  const selectedRadio = document.querySelector('input[name="quizOption"]:checked');
  if (!selectedRadio) {
    quizError.textContent = 'Please choose one of the options before continuing.';
    quizError.classList.remove('d-none');
    return;
  }

  const selectedIndex = parseInt(selectedRadio.value, 10);

  try {
    const res = await fetch('/api/quiz/check-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: currentQuestion._id,
        selectedIndex: selectedIndex,
        currentDifficulty: currentDifficulty
      })
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error || 'Error submitting answer');
      return;
    }

    // Accumulate score & save details
    currentScore += result.points;
    document.getElementById('current-score').textContent = `${currentScore} pts`;

    quizDetails.push({
      questionText: result.questionText,
      difficulty: result.difficulty,
      selectedOption: result.selectedOptionText,
      correctOption: result.correctOptionText,
      isCorrect: result.isCorrect
    });

    // Show simple adaptive feedback message
    const alertBox = document.getElementById('adaptive-alert');
    if (result.isCorrect) {
      alertBox.className = 'alert alert-success py-2 small';
      alertBox.innerHTML = `&#10004; <strong>Correct!</strong> Earned +${result.points} pts. Adapting difficulty: <strong>${result.difficulty} &rarr; ${result.nextDifficulty}</strong>`;
    } else {
      alertBox.className = 'alert alert-danger py-2 small';
      alertBox.innerHTML = `&#10008; <strong>Incorrect!</strong> Correct answer: <em>${result.correctOptionText}</em>. Adapting difficulty: <strong>${result.difficulty} &rarr; ${result.nextDifficulty}</strong>`;
    }
    alertBox.classList.remove('d-none');

    // Update difficulty for next question
    currentDifficulty = result.nextDifficulty;
    currentQuestionNumber++;

    if (currentQuestionNumber > TOTAL_QUESTIONS) {
      // Quiz complete
      setTimeout(() => {
        saveAndShowResults();
      }, 1200);
    } else {
      // Load next question
      setTimeout(() => {
        loadNextQuestion();
      }, 1000);
    }

  } catch (err) {
    console.error(err);
    alert('Error connecting to server.');
  }
}

// ==========================================
// 3. COMPLETE & SAVE QUIZ RESULTS
// ==========================================
async function saveAndShowResults() {
  const correctCount = quizDetails.filter(d => d.isCorrect).length;
  const accuracy = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;

  quizDetails.forEach(d => {
    if (d.difficulty === 'Easy') easyCount++;
    if (d.difficulty === 'Medium') mediumCount++;
    if (d.difficulty === 'Hard') hardCount++;
  });

  const payload = {
    studentName: currentStudent.name,
    regNo: currentStudent.regNo,
    email: currentStudent.email,
    score: currentScore,
    totalQuestions: TOTAL_QUESTIONS,
    correctAnswers: correctCount,
    accuracy: accuracy,
    easyCount: easyCount,
    mediumCount: mediumCount,
    hardCount: hardCount,
    details: quizDetails
  };

  try {
    // Save into MongoDB
    await fetch('/api/quiz/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Hide quiz card, show results card
    document.getElementById('quiz-card').classList.add('d-none');
    document.getElementById('result-card').classList.remove('d-none');

    // Populate result card values
    document.getElementById('res-score').textContent = `${currentScore} pts`;
    document.getElementById('res-accuracy').textContent = `${accuracy}%`;
    document.getElementById('res-correct').textContent = `${correctCount} / ${TOTAL_QUESTIONS}`;
    document.getElementById('res-regno').textContent = currentStudent.regNo;

    // Render questions review table
    const tbody = document.getElementById('result-table-body');
    tbody.innerHTML = '';
    quizDetails.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const badgeClass = item.difficulty === 'Easy' ? 'badge-easy' : (item.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${item.questionText}</td>
        <td><span class="badge ${badgeClass}">${item.difficulty}</span></td>
        <td>${item.selectedOption}</td>
        <td>
          ${item.isCorrect
            ? '<span class="text-success fw-bold">&#10004; Correct</span>'
            : `<span class="text-danger fw-bold">&#10008; Wrong</span> <br><small class="text-muted">Ans: ${item.correctOption}</small>`}
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Error saving result:', err);
  }
}

// Retake quiz as same student
function restartQuiz() {
  document.getElementById('result-card').classList.add('d-none');
  document.getElementById('quiz-card').classList.remove('d-none');
  startAdaptiveQuiz();
}

// Logout current student and return to registration form for another login
function logoutStudent() {
  currentStudent = null;
  currentQuestion = null;
  currentScore = 0;
  attemptedQuestionIds = [];
  quizDetails = [];
  currentQuestionNumber = 1;

  // Clear registration form inputs & error
  const form = document.getElementById('student-form');
  if (form) form.reset();
  const regError = document.getElementById('reg-error');
  if (regError) regError.classList.add('d-none');

  // Hide quiz card and result card, show registration form
  document.getElementById('quiz-card').classList.add('d-none');
  document.getElementById('result-card').classList.add('d-none');
  document.getElementById('registration-card').classList.remove('d-none');

  // Hide navbar user badge
  const navUserInfo = document.getElementById('nav-user-info');
  if (navUserInfo) navUserInfo.classList.add('d-none');

  // Clear analytics search field
  const analyticsInput = document.getElementById('analytics-search-email');
  if (analyticsInput) analyticsInput.value = '';

  // Switch to quiz tab
  showTab('quiz');
}

function viewMyAnalyticsFromQuiz() {
  if (currentStudent && currentStudent.email) {
    showTab('analytics');
    document.getElementById('analytics-search-email').value = currentStudent.email;
    loadStudentAnalytics();
  }
}

// ==========================================
// 4. PERFORMANCE ANALYTICS & CHART.JS
// ==========================================
async function loadStudentAnalytics() {
  const emailInput = document.getElementById('analytics-search-email');
  const errorBox = document.getElementById('analytics-error');
  const content = document.getElementById('analytics-content');

  errorBox.classList.add('d-none');
  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    errorBox.textContent = 'Please enter an email address to view analytics.';
    errorBox.classList.remove('d-none');
    return;
  }

  try {
    const res = await fetch(`/api/analytics/student/${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!data.hasData) {
      errorBox.textContent = 'No quiz records found for this student email.';
      errorBox.classList.remove('d-none');
      content.classList.add('d-none');
      return;
    }

    content.classList.remove('d-none');

    // Populate stat cards
    document.getElementById('stat-attempts').textContent = data.totalAttempts;
    document.getElementById('stat-best').textContent = `${data.bestScore} pts`;
    document.getElementById('stat-accuracy').textContent = `${data.avgAccuracy}%`;
    document.getElementById('stat-avg-score').textContent = `${data.avgScore} pts`;

    // Populate history table
    const tbody = document.getElementById('analytics-history-body');
    tbody.innerHTML = '';
    data.history.forEach(h => {
      const tr = document.createElement('tr');
      const dateStr = new Date(h.date).toLocaleDateString();
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td><strong>${h.score} pts</strong></td>
        <td>${h.correctAnswers} / ${h.totalQuestions}</td>
        <td><span class="badge bg-secondary">${h.accuracy}%</span></td>
        <td>${h.easyCount || 0}</td>
        <td>${h.mediumCount || 0}</td>
        <td>${h.hardCount || 0}</td>
      `;
      tbody.appendChild(tr);
    });

    // Render / Update Chart.js Chart
    renderChart(data.history);

  } catch (err) {
    console.error(err);
    errorBox.textContent = 'Error fetching analytics from server.';
    errorBox.classList.remove('d-none');
  }
}

function renderChart(history) {
  const ctx = document.getElementById('performanceChart').getContext('2d');

  // Reverse so chronological order (attempt 1, attempt 2, etc.)
  const reversed = [...history].reverse();
  const labels = reversed.map((_, i) => `Attempt ${i + 1}`);
  const scores = reversed.map(h => h.score);
  const accuracies = reversed.map(h => h.accuracy);

  if (myChartInstance) {
    myChartInstance.destroy();
  }

  myChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Score (Points)',
          data: scores,
          backgroundColor: 'rgba(13, 110, 253, 0.7)',
          borderColor: 'rgb(13, 110, 253)',
          borderWidth: 1
        },
        {
          label: 'Accuracy (%)',
          data: accuracies,
          backgroundColor: 'rgba(25, 135, 84, 0.7)',
          borderColor: 'rgb(25, 135, 84)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ==========================================
// 5. LEADERBOARD
// ==========================================
async function loadLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  try {
    const res = await fetch('/api/analytics/leaderboard');
    const list = await res.json();

    tbody.innerHTML = '';
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">No scores recorded yet. Be the first to take the quiz!</td></tr>';
      return;
    }

    list.forEach((item, index) => {
      const tr = document.createElement('tr');
      const dateStr = new Date(item.date).toLocaleDateString();
      const rankBadge = index === 0 ? '🥇 1st' : (index === 1 ? '🥈 2nd' : (index === 2 ? '🥉 3rd' : `#${index + 1}`));
      tr.innerHTML = `
        <td class="fw-bold">${rankBadge}</td>
        <td>${item.studentName}</td>
        <td>${item.regNo}</td>
        <td><strong class="text-primary">${item.score} pts</strong></td>
        <td><span class="badge bg-success">${item.accuracy}%</span></td>
        <td class="text-muted small">${dateStr}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Failed to load leaderboard.</td></tr>';
  }
}

// ==========================================
// 6. QUESTION BANK MANAGEMENT (CRUD)
// ==========================================
async function loadQuestionsList() {
  const tbody = document.getElementById('questions-list-body');
  const countSpan = document.getElementById('q-count');

  try {
    const res = await fetch('/api/questions');
    const questions = await res.json();

    countSpan.textContent = questions.length;
    tbody.innerHTML = '';

    if (questions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center py-3">No questions in database. Use seed script or add one.</td></tr>';
      return;
    }

    questions.forEach(q => {
      const tr = document.createElement('tr');
      const badgeClass = q.difficulty === 'Easy' ? 'badge-easy' : (q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard');
      tr.innerHTML = `
        <td>${q.questionText}</td>
        <td><span class="badge ${badgeClass}">${q.difficulty}</span></td>
        <td>
          <button class="btn btn-outline-danger btn-sm py-0 px-2" onclick="deleteQuestion('${q._id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="3" class="text-danger text-center">Failed to load questions.</td></tr>';
  }
}

async function handleAddQuestion(e) {
  e.preventDefault();

  const msgBox = document.getElementById('add-q-msg');
  msgBox.className = 'alert d-none py-2 small';

  const questionText = document.getElementById('new-q-text').value.trim();
  const difficulty = document.getElementById('new-q-diff').value;
  const category = document.getElementById('new-q-cat').value.trim();
  const option0 = document.getElementById('new-opt-0').value.trim();
  const option1 = document.getElementById('new-opt-1').value.trim();
  const option2 = document.getElementById('new-opt-2').value.trim();
  const option3 = document.getElementById('new-opt-3').value.trim();
  const correctIndex = parseInt(document.getElementById('new-q-correct').value, 10);

  // Input Validation
  if (questionText.length < 5) {
    msgBox.className = 'alert alert-danger py-2 small';
    msgBox.textContent = 'Question text must be at least 5 characters.';
    return;
  }

  if (!option0 || !option1 || !option2 || !option3) {
    msgBox.className = 'alert alert-danger py-2 small';
    msgBox.textContent = 'All 4 options must be filled.';
    return;
  }

  try {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionText,
        difficulty,
        category,
        option0,
        option1,
        option2,
        option3,
        correctIndex
      })
    });

    const data = await res.json();
    if (!res.ok) {
      msgBox.className = 'alert alert-danger py-2 small';
      msgBox.textContent = data.error || 'Failed to add question.';
      return;
    }

    msgBox.className = 'alert alert-success py-2 small';
    msgBox.textContent = 'Question added successfully!';
    document.getElementById('add-question-form').reset();
    loadQuestionsList();

  } catch (err) {
    console.error(err);
    msgBox.className = 'alert alert-danger py-2 small';
    msgBox.textContent = 'Server error adding question.';
  }
}

async function deleteQuestion(id) {
  if (!confirm('Are you sure you want to delete this question?')) return;

  try {
    const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      loadQuestionsList();
    } else {
      alert(data.error || 'Failed to delete question.');
    }
  } catch (err) {
    console.error(err);
    alert('Error connecting to server.');
  }
}
