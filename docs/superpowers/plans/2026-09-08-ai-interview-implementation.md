# AI Interview App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app for HR to screen candidates via AI-powered interviews in 3 phases: Setup → Interview → Review.

**Architecture:** 
- Backend: Node.js/Express with SQLite database, Qwen API integration
- Frontend: Vanilla HTML/CSS/JS (simple, no framework for MVP)
- 7 backend services handling JD parsing, skill suggestions, question generation, interview logic, rubric generation, and exports
- State machine for adaptive interview with max 3 follow-ups per question

**Tech Stack:** Node.js, Express, SQLite (better-sqlite3), Qwen 3.7 Plus API, Vanilla JS, axios for HTTP calls

---

## File Structure

**Backend:**
- `src/server.js` — Express app entry point
- `src/db/init.js` — SQLite schema initialization
- `src/services/jdParser.js` — JD extraction service
- `src/services/skillsSuggester.js` — Skills suggestion service
- `src/services/questionGenerator.js` — Question generation service
- `src/services/sessionManager.js` — Session CRUD operations
- `src/services/interviewEngine.js` — Interview state machine
- `src/services/aiIntegration.js` — Qwen API wrapper
- `src/services/rubricGenerator.js` — Rubric creation service
- `src/services/exportService.js` — PDF/CSV export service
- `src/routes/setupRoutes.js` — Setup phase endpoints
- `src/routes/interviewRoutes.js` — Interview phase endpoints
- `src/routes/reviewRoutes.js` — Review phase endpoints

**Frontend:**
- `public/index.html` — Main HTML
- `public/css/style.css` — Styling
- `public/js/app.js` — Main app controller
- `public/js/setupPage.js` — HR setup flow
- `public/js/interviewPage.js` — Candidate interview
- `public/js/reviewPage.js` — HR review

**Tests:**
- `tests/services/jdParser.test.js`
- `tests/services/sessionManager.test.js`
- `tests/services/interviewEngine.test.js`
- `tests/routes/setup.test.js`
- `tests/routes/interview.test.js`

---

## Tasks

### Task 1: Database Schema & Initialization

**Files:**
- Create: `src/db/init.js`
- Create: `src/db/database.js`

- [ ] **Step 1: Create database initialization script**

```javascript
// src/db/init.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../interview.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create sessions table
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    hr_email TEXT,
    job_title TEXT,
    level TEXT,
    company TEXT,
    skills TEXT,
    questions_by_skill TEXT,
    candidate_name TEXT,
    status TEXT DEFAULT 'setup',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME
  );
`);

// Create messages table
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    skill_being_evaluated TEXT,
    question_index INTEGER,
    attempt_number INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );
`);

// Create rubrics table
db.exec(`
  CREATE TABLE IF NOT EXISTS rubrics (
    rubric_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    score REAL,
    evidence TEXT,
    strengths TEXT,
    weaknesses TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  );
`);

console.log('Database initialized:', dbPath);
module.exports = db;
```

- [ ] **Step 2: Create database wrapper with query helpers**

```javascript
// src/db/database.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../interview.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Session queries
const getSession = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
  return stmt.get(sessionId);
};

const createSession = (sessionId, hrEmail, jobTitle, level, company, skills, questionsBySkill) => {
  const stmt = db.prepare(`
    INSERT INTO sessions (session_id, hr_email, job_title, level, company, skills, questions_by_skill)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, hrEmail, jobTitle, level, company, JSON.stringify(skills), JSON.stringify(questionsBySkill));
};

const updateSessionStatus = (sessionId, status, candidateName = null) => {
  let query = 'UPDATE sessions SET status = ?';
  const params = [status];
  if (candidateName) {
    query += ', candidate_name = ?, started_at = CURRENT_TIMESTAMP';
    params.push(candidateName);
  }
  query += ' WHERE session_id = ?';
  params.push(sessionId);
  const stmt = db.prepare(query);
  return stmt.run(...params);
};

// Message queries
const addMessage = (sessionId, sender, content, skillName = null, questionIndex = null, attemptNumber = null) => {
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, sender, content, skill_being_evaluated, question_index, attempt_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, sender, content, skillName, questionIndex, attemptNumber);
};

const getMessages = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
  return stmt.all(sessionId);
};

// Rubric queries
const addRubric = (sessionId, skillName, score, evidence, strengths, weaknesses) => {
  const stmt = db.prepare(`
    INSERT INTO rubrics (session_id, skill_name, score, evidence, strengths, weaknesses)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, skillName, score, evidence, JSON.stringify(strengths), JSON.stringify(weaknesses));
};

const getRubrics = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM rubrics WHERE session_id = ?');
  return stmt.all(sessionId);
};

module.exports = {
  db,
  getSession,
  createSession,
  updateSessionStatus,
  addMessage,
  getMessages,
  addRubric,
  getRubrics
};
```

- [ ] **Step 3: Run initialization script on startup**

```javascript
// In src/server.js, at top:
require('./db/init');
const { db } = require('./db/database');
console.log('Database ready');
```

- [ ] **Step 4: Commit**

```bash
git add src/db/init.js src/db/database.js
git commit -m "feat: setup SQLite database schema with sessions, messages, rubrics tables"
```

---

### Task 2: Qwen API Integration Wrapper

**Files:**
- Create: `src/services/qwenClient.js`

- [ ] **Step 1: Create Qwen API client**

```javascript
// src/services/qwenClient.js
const axios = require('axios');

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-3.7-plus';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const callQwen = async (messages, systemPrompt = null) => {
  try {
    const payload = {
      model: QWEN_MODEL,
      messages: systemPrompt 
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      top_p: 0.8,
      temperature: 0.7,
      max_tokens: 2000
    };

    const response = await axios.post(QWEN_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.output.text;
  } catch (error) {
    console.error('Qwen API error:', error.message);
    throw new Error(`Qwen API failed: ${error.message}`);
  }
};

module.exports = { callQwen };
```

- [ ] **Step 2: Test Qwen client**

```javascript
// tests/services/qwenClient.test.js
const { callQwen } = require('../../src/services/qwenClient');

describe('Qwen Client', () => {
  test('callQwen returns string response', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await callQwen(messages);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 15000);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/services/qwenClient.js tests/services/qwenClient.test.js
git commit -m "feat: add Qwen API client wrapper with error handling"
```

---

### Task 3: JD Parser Service

**Files:**
- Create: `src/services/jdParser.js`

- [ ] **Step 1: Implement JD parser**

```javascript
// src/services/jdParser.js
const { callQwen } = require('./qwenClient');

const parseJD = async (jdText) => {
  const systemPrompt = `You are an expert HR assistant. Extract job title, level, and company from the given job description. 
Return ONLY a JSON object (no markdown, no explanation): 
{ "job_title": "...", "level": "...", "company": "..." }
Levels must be one of: Junior, Mid, Senior`;

  const messages = [
    { role: 'user', content: `Extract fields from this JD:\n${jdText}` }
  ];

  try {
    const response = await callQwen(messages, systemPrompt);
    const parsed = JSON.parse(response);
    return {
      job_title: parsed.job_title || 'Unknown Position',
      level: ['Junior', 'Mid', 'Senior'].includes(parsed.level) ? parsed.level : 'Mid',
      company: parsed.company || 'Unknown Company'
    };
  } catch (error) {
    console.error('JD parsing error:', error);
    return {
      job_title: 'Position',
      level: 'Mid',
      company: 'Company'
    };
  }
};

module.exports = { parseJD };
```

- [ ] **Step 2: Test JD parser**

```javascript
// tests/services/jdParser.test.js
const { parseJD } = require('../../src/services/jdParser');

describe('JD Parser', () => {
  test('parseJD extracts title, level, company', async () => {
    const jd = `
      Senior Backend Engineer - Vietnam
      We're looking for a Senior Backend Engineer with 5+ years experience.
      Company: VNG Games
    `;
    const result = await parseJD(jd);
    expect(result).toHaveProperty('job_title');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('company');
    expect(['Junior', 'Mid', 'Senior']).toContain(result.level);
  }, 15000);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/services/jdParser.js tests/services/jdParser.test.js
git commit -m "feat: add JD parser service using Qwen"
```

---

### Task 4: Skills Suggester Service

**Files:**
- Create: `src/services/skillsSuggester.js`

- [ ] **Step 1: Implement skills suggester**

```javascript
// src/services/skillsSuggester.js
const { callQwen } = require('./qwenClient');

const suggestSkills = async (jdText, jobTitle, level) => {
  const systemPrompt = `You are an expert HR consultant. Suggest 1-5 key skills to evaluate candidates for a job.
Return ONLY a JSON array of skill names (no markdown, no explanation):
["skill1", "skill2", "skill3"]`;

  const messages = [
    { role: 'user', content: `For a ${level} ${jobTitle} position, suggest key skills to evaluate based on this JD:\n${jdText}` }
  ];

  try {
    const response = await callQwen(messages, systemPrompt);
    const skills = JSON.parse(response);
    return Array.isArray(skills) ? skills.slice(0, 5) : ['Technical Skills', 'Communication'];
  } catch (error) {
    console.error('Skills suggestion error:', error);
    return ['Technical Skills', 'Communication', 'Problem Solving'];
  }
};

module.exports = { suggestSkills };
```

- [ ] **Step 2: Test skills suggester**

```javascript
// tests/services/skillsSuggester.test.js
const { suggestSkills } = require('../../src/services/skillsSuggester');

describe('Skills Suggester', () => {
  test('suggestSkills returns 1-5 skills', async () => {
    const jd = 'Senior Backend Engineer with Node.js and database experience';
    const result = await suggestSkills(jd, 'Backend Engineer', 'Senior');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(5);
  }, 15000);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/services/skillsSuggester.js tests/services/skillsSuggester.test.js
git commit -m "feat: add skills suggester service"
```

---

### Task 5: Question Generator Service

**Files:**
- Create: `src/services/questionGenerator.js`

- [ ] **Step 1: Implement question generator**

```javascript
// src/services/questionGenerator.js
const { callQwen } = require('./qwenClient');

const generateQuestions = async (jdText, skills, jobTitle, level) => {
  const systemPrompt = `You are an expert interview designer. Generate 2-4 thoughtful interview questions for evaluating each skill.
Return ONLY a JSON object where keys are skill names and values are arrays of questions (no markdown, no explanation):
{"Skill 1": ["Question 1", "Question 2", "Question 3"], "Skill 2": ["Question 1", "Question 2"]}`;

  const skillsStr = skills.join(', ');
  const messages = [
    { role: 'user', content: `Generate interview questions for a ${level} ${jobTitle}.
Skills to evaluate: ${skillsStr}
JD: ${jdText}` }
  ];

  try {
    const response = await callQwen(messages, systemPrompt);
    const questions = JSON.parse(response);
    return questions;
  } catch (error) {
    console.error('Question generation error:', error);
    // Fallback questions
    const fallback = {};
    skills.forEach(skill => {
      fallback[skill] = [
        `Tell me about your experience with ${skill}.`,
        `How do you apply ${skill} in your work?`
      ];
    });
    return fallback;
  }
};

module.exports = { generateQuestions };
```

- [ ] **Step 2: Test question generator**

```javascript
// tests/services/questionGenerator.test.js
const { generateQuestions } = require('../../src/services/questionGenerator');

describe('Question Generator', () => {
  test('generateQuestions returns questions per skill', async () => {
    const skills = ['Problem Solving', 'Communication'];
    const result = await generateQuestions('Sample JD', skills, 'Engineer', 'Mid');
    expect(typeof result).toBe('object');
    expect(result['Problem Solving']).toBeDefined();
    expect(Array.isArray(result['Problem Solving'])).toBe(true);
  }, 15000);
});
```

- [ ] **Step 3: Commit**

```bash
git add src/services/questionGenerator.js tests/services/questionGenerator.test.js
git commit -m "feat: add question generator service"
```

---

### Task 6: Session Manager Service

**Files:**
- Create: `src/services/sessionManager.js`

- [ ] **Step 1: Implement session manager**

```javascript
// src/services/sessionManager.js
const { v4: uuidv4 } = require('uuid');
const { getSession, createSession, updateSessionStatus, getMessages, addMessage, addRubric, getRubrics } = require('../db/database');

const createNewSession = (hrEmail, jobTitle, level, company, skills, questionsBySkill) => {
  const sessionId = uuidv4();
  createSession(sessionId, hrEmail, jobTitle, level, company, skills, questionsBySkill);
  return sessionId;
};

const getSessionData = (sessionId) => {
  const session = getSession(sessionId);
  if (!session) return null;
  return {
    ...session,
    skills: JSON.parse(session.skills),
    questions_by_skill: JSON.parse(session.questions_by_skill)
  };
};

const startInterview = (sessionId, candidateName) => {
  updateSessionStatus(sessionId, 'in_progress', candidateName);
};

const endInterview = (sessionId) => {
  updateSessionStatus(sessionId, 'completed');
};

const saveMessage = (sessionId, sender, content, skillName = null, questionIndex = null, attemptNumber = null) => {
  addMessage(sessionId, sender, content, skillName, questionIndex, attemptNumber);
};

const getSessionMessages = (sessionId) => {
  return getMessages(sessionId);
};

const addSkillRubric = (sessionId, skillName, score, evidence, strengths, weaknesses) => {
  addRubric(sessionId, skillName, score, evidence, strengths, weaknesses);
};

const getSessionRubric = (sessionId) => {
  return getRubrics(sessionId);
};

module.exports = {
  createNewSession,
  getSessionData,
  startInterview,
  endInterview,
  saveMessage,
  getSessionMessages,
  addSkillRubric,
  getSessionRubric
};
```

- [ ] **Step 2: Add uuid dependency**

```bash
npm install uuid
```

- [ ] **Step 3: Commit**

```bash
git add src/services/sessionManager.js
git commit -m "feat: add session manager with CRUD operations"
```

---

### Task 7: Interview Engine Service

**Files:**
- Create: `src/services/interviewEngine.js`

- [ ] **Step 1: Implement interview state machine**

```javascript
// src/services/interviewEngine.js
const initializeInterviewState = (skills, questionsBySkill) => {
  return {
    current_skill_index: 0,
    current_question_index: 0,
    attempt_count: 0,
    skills: skills,
    questions_by_skill: questionsBySkill,
    interview_complete: false
  };
};

const getCurrentQuestion = (state) => {
  if (state.interview_complete) return null;
  const skillName = state.skills[state.current_skill_index];
  const questions = state.questions_by_skill[skillName];
  return {
    skill_name: skillName,
    question_text: questions[state.current_question_index],
    question_index: state.current_question_index,
    attempt_number: state.attempt_count + 1
  };
};

const processAnswerQuality = (state, answerIsGood) => {
  if (answerIsGood || state.attempt_count >= 2) {
    // Move to next question
    state.attempt_count = 0;
    state.current_question_index += 1;

    const currentSkill = state.skills[state.current_skill_index];
    const questionsInSkill = state.questions_by_skill[currentSkill].length;

    if (state.current_question_index >= questionsInSkill) {
      // Move to next skill
      state.current_question_index = 0;
      state.current_skill_index += 1;

      if (state.current_skill_index >= state.skills.length) {
        // Interview complete
        state.interview_complete = true;
      }
    }
    return 'next_question';
  } else {
    // Follow-up
    state.attempt_count += 1;
    return 'follow_up';
  }
};

const isInterviewComplete = (state) => {
  return state.interview_complete;
};

module.exports = {
  initializeInterviewState,
  getCurrentQuestion,
  processAnswerQuality,
  isInterviewComplete
};
```

- [ ] **Step 2: Test interview engine**

```javascript
// tests/services/interviewEngine.test.js
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality, isInterviewComplete } = require('../../src/services/interviewEngine');

describe('Interview Engine', () => {
  test('initializes state correctly', () => {
    const skills = ['Problem Solving', 'Communication'];
    const questions = {
      'Problem Solving': ['Q1', 'Q2'],
      'Communication': ['Q3']
    };
    const state = initializeInterviewState(skills, questions);
    expect(state.current_skill_index).toBe(0);
    expect(state.current_question_index).toBe(0);
  });

  test('getCurrentQuestion returns current question', () => {
    const skills = ['Problem Solving'];
    const questions = { 'Problem Solving': ['Question 1', 'Question 2'] };
    const state = initializeInterviewState(skills, questions);
    const q = getCurrentQuestion(state);
    expect(q.skill_name).toBe('Problem Solving');
    expect(q.question_text).toBe('Question 1');
  });

  test('processAnswerQuality moves to next question on good answer', () => {
    const skills = ['Problem Solving'];
    const questions = { 'Problem Solving': ['Q1', 'Q2'] };
    const state = initializeInterviewState(skills, questions);
    const action = processAnswerQuality(state, true);
    expect(action).toBe('next_question');
    expect(state.current_question_index).toBe(1);
  });

  test('processAnswerQuality returns follow_up on poor answer', () => {
    const skills = ['Problem Solving'];
    const questions = { 'Problem Solving': ['Q1'] };
    const state = initializeInterviewState(skills, questions);
    const action = processAnswerQuality(state, false);
    expect(action).toBe('follow_up');
    expect(state.attempt_count).toBe(1);
  });

  test('interview completes after all questions', () => {
    const skills = ['Problem Solving'];
    const questions = { 'Problem Solving': ['Q1'] };
    const state = initializeInterviewState(skills, questions);
    processAnswerQuality(state, true);
    expect(isInterviewComplete(state)).toBe(true);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/services/interviewEngine.js tests/services/interviewEngine.test.js
git commit -m "feat: add interview state machine with question flow logic"
```

---

### Task 8: AI Interview Conductor Service

**Files:**
- Create: `src/services/aiIntegration.js`

- [ ] **Step 1: Implement AI interview conductor**

```javascript
// src/services/aiIntegration.js
const { callQwen } = require('./qwenClient');

const conductInterview = async (currentQuestion, previousMessages, candidateName, jobTitle, level) => {
  const messageHistory = previousMessages.map(msg => ({
    role: msg.sender === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));

  const systemPrompt = `Bạn đang phỏng vấn cho vị trí ${jobTitle} ở level ${level}.
Tên ứng viên: ${candidateName}

Câu hỏi hiện tại: ${currentQuestion.question_text}
Kỹ năng đang đánh giá: ${currentQuestion.skill_name}
Đây là lần hỏi ${currentQuestion.attempt_number}/3.

Hướng dẫn:
1. Hỏi câu hỏi một cách tự nhiên, như trong hội thoại.
2. Sử dụng tên ứng viên (${candidateName}) khi chào hỏi để tạo cảm giác thân thiện.
3. Chờ câu trả lời của ứng viên.
4. Đánh giá câu trả lời:
   - Nó có chi tiết, trả lời đầy đủ không? (câu trả lời tốt)
   - Nó có mơ hồ, không đầy đủ, không trả lời câu hỏi không? (câu trả lời yếu)
5. Nếu câu trả lời tốt:
   - Phát biểu tích cực.
   - Kết thúc bằng: [[ANSWER_GOOD]]
6. Nếu câu trả lời yếu VÀ lần hỏi < 3:
   - Hỏi ONE follow-up: "Bạn có thể kể thêm về [phần cụ thể] không?"
7. Nếu lần hỏi = 3:
   - Cảm ơn ứng viên về câu trả lời (đừng đánh dấu là tốt).
   - Chờ backend gửi câu hỏi tiếp theo.`;

  const response = await callQwen(messageHistory, systemPrompt);
  const answerIsGood = response.includes('[[ANSWER_GOOD]]');
  
  return {
    ai_response: response.replace('[[ANSWER_GOOD]]', '').trim(),
    answer_good: answerIsGood
  };
};

module.exports = { conductInterview };
```

- [ ] **Step 2: Commit**

```bash
git add src/services/aiIntegration.js
git commit -m "feat: add AI interview conductor with system prompt"
```

---

### Task 9: Rubric Generator Service

**Files:**
- Create: `src/services/rubricGenerator.js`

- [ ] **Step 1: Implement rubric generator**

```javascript
// src/services/rubricGenerator.js
const { callQwen } = require('./qwenClient');

const generateRubric = async (messages, skills) => {
  const chatHistory = messages
    .map(m => `${m.sender === 'ai' ? 'AI' : 'Candidate'}: ${m.content}`)
    .join('\n\n');

  const skillEvaluations = [];

  for (const skill of skills) {
    const systemPrompt = `You are an expert interviewer evaluating candidates. Analyze the interview chat and score the "${skill}" skill on a 0-10 scale.
Return ONLY a JSON object (no markdown, no explanation):
{ "score": 7, "evidence": "specific examples from chat", "strengths": ["strength1", "strength2"], "weaknesses": ["weakness1"] }`;

    const messages_qwen = [
      { role: 'user', content: `Evaluate "${skill}" from this interview:\n\n${chatHistory}` }
    ];

    try {
      const response = await callQwen(messages_qwen, systemPrompt);
      const evaluation = JSON.parse(response);
      skillEvaluations.push({
        skill_name: skill,
        score: evaluation.score || 5,
        evidence: evaluation.evidence || 'No evidence',
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || []
      });
    } catch (error) {
      console.error(`Error evaluating ${skill}:`, error);
      skillEvaluations.push({
        skill_name: skill,
        score: 5,
        evidence: 'Unable to evaluate',
        strengths: [],
        weaknesses: []
      });
    }
  }

  return skillEvaluations;
};

module.exports = { generateRubric };
```

- [ ] **Step 2: Commit**

```bash
git add src/services/rubricGenerator.js
git commit -m "feat: add rubric generator service"
```

---

### Task 10: Export Service

**Files:**
- Create: `src/services/exportService.js`

- [ ] **Step 1: Install pdf library**

```bash
npm install pdfkit csv-writer
```

- [ ] **Step 2: Implement export service**

```javascript
// src/services/exportService.js
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

const generatePDF = (sessionData, messages, rubric) => {
  const fileName = `interview_${sessionData.session_id}.pdf`;
  const filePath = path.join(__dirname, '../../tmp', fileName);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  // Title
  doc.fontSize(20).text('Interview Results', { underline: true });
  doc.fontSize(12).text(`Job: ${sessionData.job_title}`);
  doc.text(`Level: ${sessionData.level}`);
  doc.text(`Candidate: ${sessionData.candidate_name || 'Anonymous'}`);
  doc.moveDown();

  // Chat History
  doc.fontSize(14).text('Chat History', { underline: true });
  messages.forEach((msg, i) => {
    const sender = msg.sender === 'ai' ? 'AI' : 'Candidate';
    doc.fontSize(11).text(`${sender}: ${msg.content.substring(0, 200)}...`);
  });
  doc.moveDown();

  // Rubric
  doc.fontSize(14).text('Evaluation Rubric', { underline: true });
  rubric.forEach(r => {
    doc.fontSize(11).text(`${r.skill_name}: ${r.score}/10`);
    doc.fontSize(10).text(`Evidence: ${r.evidence}`);
  });

  doc.end();
  return filePath;
};

const generateCSV = (rubric) => {
  const fileName = `rubric_${Date.now()}.csv`;
  const filePath = path.join(__dirname, '../../tmp', fileName);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: 'skill_name', title: 'Skill' },
      { id: 'score', title: 'Score' },
      { id: 'evidence', title: 'Evidence' }
    ]
  });

  const records = rubric.map(r => ({
    skill_name: r.skill_name,
    score: r.score,
    evidence: r.evidence
  }));

  csvWriter.writeRecords(records);
  return filePath;
};

module.exports = { generatePDF, generateCSV };
```

- [ ] **Step 3: Commit**

```bash
git add src/services/exportService.js
git commit -m "feat: add export service for PDF and CSV"
```

---

### Task 11: Express App Setup

**Files:**
- Create: `src/server.js`
- Modify: `package.json` (already done)

- [ ] **Step 1: Create Express server with basic routes**

```javascript
// src/server.js
require('dotenv').config();
require('./db/init');

const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/setup', require('./routes/setupRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));
app.use('/api/review', require('./routes/reviewRoutes'));

// Home page redirect
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/server.js
git commit -m "feat: setup Express server with basic middleware"
```

---

### Task 12: Setup Routes (Phase 1)

**Files:**
- Create: `src/routes/setupRoutes.js`

- [ ] **Step 1: Create setup routes**

```javascript
// src/routes/setupRoutes.js
const express = require('express');
const router = express.Router();
const { parseJD } = require('../services/jdParser');
const { suggestSkills } = require('../services/skillsSuggester');
const { generateQuestions } = require('../services/questionGenerator');
const { createNewSession } = require('../services/sessionManager');

// POST /api/setup/parse-jd
router.post('/parse-jd', async (req, res) => {
  try {
    const { jd_text } = req.body;
    if (!jd_text) {
      return res.status(400).json({ error: 'jd_text required' });
    }
    const result = await parseJD(jd_text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/setup/suggest-skills
router.post('/suggest-skills', async (req, res) => {
  try {
    const { jd_text } = req.body;
    if (!jd_text) {
      return res.status(400).json({ error: 'jd_text required' });
    }
    const skills = await suggestSkills(jd_text, 'Position', 'Mid');
    res.json({ skills });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/setup/suggest-questions
router.post('/suggest-questions', async (req, res) => {
  try {
    const { jd_text, skills, job_title, level } = req.body;
    if (!jd_text || !skills || !job_title || !level) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const questions = await generateQuestions(jd_text, skills, job_title, level);
    res.json({ questions_by_skill: questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/setup/create-session
router.post('/create-session', (req, res) => {
  try {
    const { job_title, level, company, skills, questions_by_skill } = req.body;
    if (!job_title || !level || !skills || !questions_by_skill) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const sessionId = createNewSession('hr@company.com', job_title, level, company, skills, questions_by_skill);
    const interviewLink = `/interview/${sessionId}`;
    res.json({ session_id: sessionId, interview_link: interviewLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/setupRoutes.js
git commit -m "feat: add setup phase API endpoints"
```

---

### Task 13: Interview Routes (Phase 2)

**Files:**
- Create: `src/routes/interviewRoutes.js`

- [ ] **Step 1: Create interview routes**

```javascript
// src/routes/interviewRoutes.js
const express = require('express');
const router = express.Router();
const { getSessionData, startInterview, saveMessage, getSessionMessages } = require('../services/sessionManager');
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality } = require('../services/interviewEngine');
const { conductInterview } = require('../services/aiIntegration');

// GET /api/interview/:sessionId
router.get('/:sessionId', (req, res) => {
  try {
    const sessionData = getSessionData(req.params.sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const messages = getSessionMessages(req.params.sessionId);
    res.json({
      session_id: req.params.sessionId,
      status: sessionData.status,
      candidate_name: sessionData.candidate_name,
      job_title: sessionData.job_title,
      messages: messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/interview/:sessionId/start
router.post('/:sessionId/start', (req, res) => {
  try {
    const { candidate_name } = req.body;
    if (!candidate_name) {
      return res.status(400).json({ error: 'candidate_name required' });
    }
    const sessionData = getSessionData(req.params.sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }
    startInterview(req.params.sessionId, candidate_name);
    res.json({ status: 'in_progress', message: 'Interview started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/interview/:sessionId/message
router.post('/:sessionId/message', async (req, res) => {
  try {
    const { candidate_answer } = req.body;
    if (!candidate_answer) {
      return res.status(400).json({ error: 'candidate_answer required' });
    }
    const sessionData = getSessionData(req.params.sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Initialize state if not exists (first message)
    const messages = getSessionMessages(req.params.sessionId);
    let state = null;
    const aiMessages = messages.filter(m => m.sender === 'ai');
    
    if (aiMessages.length === 0) {
      // First turn: initialize state and send first question
      state = initializeInterviewState(sessionData.skills, sessionData.questions_by_skill);
      const currentQ = getCurrentQuestion(state);
      
      const firstMessage = `Xin chào ${sessionData.candidate_name}! Tôi sẽ phỏng vấn bạn cho vị trí ${sessionData.job_title}. Bắt đầu thôi.\n\n${currentQ.question_text}`;
      saveMessage(req.params.sessionId, 'ai', firstMessage, currentQ.skill_name, currentQ.question_index, 1);
      
      return res.json({
        session_id: req.params.sessionId,
        ai_response: firstMessage,
        next_action: 'wait_for_answer'
      });
    }

    // Save candidate answer
    saveMessage(req.params.sessionId, 'candidate', candidate_answer);

    // Reconstruct state from messages (simplified: assume 2 attempts max for now)
    const stateKey = `state_${req.params.sessionId}`;
    if (!global[stateKey]) {
      global[stateKey] = initializeInterviewState(sessionData.skills, sessionData.questions_by_skill);
    }
    state = global[stateKey];

    // Get current question before processing
    const currentQ = getCurrentQuestion(state);
    
    // Conduct interview
    const { ai_response, answer_good } = await conductInterview(
      currentQ,
      messages,
      sessionData.candidate_name,
      sessionData.job_title,
      sessionData.level
    );

    // Process answer quality
    const nextAction = processAnswerQuality(state, answer_good);
    saveMessage(req.params.sessionId, 'ai', ai_response, currentQ.skill_name, currentQ.question_index, state.attempt_count);

    // Check if interview complete
    if (state.interview_complete) {
      saveMessage(req.params.sessionId, 'ai', 'Cảm ơn bạn đã tham gia phỏng vấn! Kết quả đã được gửi cho HR.');
      return res.json({
        session_id: req.params.sessionId,
        ai_response: ai_response,
        next_action: 'end_interview'
      });
    }

    res.json({
      session_id: req.params.sessionId,
      ai_response: ai_response,
      next_action: nextAction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/interviewRoutes.js
git commit -m "feat: add interview phase API endpoints with state machine"
```

---

### Task 14: Review Routes (Phase 3)

**Files:**
- Create: `src/routes/reviewRoutes.js`

- [ ] **Step 1: Create review routes**

```javascript
// src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { getSessionData, getSessionMessages, addSkillRubric, getSessionRubric } = require('../services/sessionManager');
const { generateRubric } = require('../services/rubricGenerator');
const { generatePDF, generateCSV } = require('../services/exportService');
const fs = require('fs');

// GET /api/review/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const sessionData = getSessionData(req.params.sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const messages = getSessionMessages(req.params.sessionId);
    let rubrics = getSessionRubric(req.params.sessionId);

    // If rubric not generated yet, generate it
    if (rubrics.length === 0) {
      const evaluations = await generateRubric(messages, sessionData.skills);
      evaluations.forEach(e => {
        addSkillRubric(req.params.sessionId, e.skill_name, e.score, e.evidence, e.strengths, e.weaknesses);
      });
      rubrics = evaluations;
    }

    res.json({
      session_id: req.params.sessionId,
      candidate_name: sessionData.candidate_name,
      job_title: sessionData.job_title,
      messages: messages,
      rubric: rubrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/review/:sessionId/export
router.post('/:sessionId/export', (req, res) => {
  try {
    const { format } = req.body;
    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'format must be pdf or csv' });
    }

    const sessionData = getSessionData(req.params.sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = getSessionMessages(req.params.sessionId);
    const rubrics = getSessionRubric(req.params.sessionId);

    let filePath;
    if (format === 'pdf') {
      filePath = generatePDF(sessionData, messages, rubrics);
    } else {
      filePath = generateCSV(rubrics);
    }

    res.download(filePath, `interview_${req.params.sessionId}.${format}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/reviewRoutes.js
git commit -m "feat: add review phase API endpoints with rubric generation and export"
```

---

### Task 15: Frontend Setup Page

**Files:**
- Create: `public/index.html`
- Create: `public/css/style.css`
- Create: `public/js/app.js`
- Create: `public/js/setupPage.js`

- [ ] **Step 1: Create main HTML structure**

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phỏng vấn với AI</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div id="app"></div>
  <script src="/js/app.js"></script>
  <script src="/js/setupPage.js"></script>
  <script src="/js/interviewPage.js"></script>
  <script src="/js/reviewPage.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create basic CSS**

```css
/* public/css/style.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 24px;
  margin-bottom: 5px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

textarea, input[type="text"], select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
}

textarea:focus, input:focus, select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

button:hover {
  background: #45a049;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #d32f2f;
  background: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success {
  color: #388e3c;
  background: #e8f5e9;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.chat-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 15px;
}

.message {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 4px;
}

.message.ai {
  background: #e3f2fd;
  text-align: left;
}

.message.candidate {
  background: #f1f8e9;
  text-align: right;
}

.input-area {
  display: flex;
  gap: 10px;
}

.input-area textarea {
  flex: 1;
  resize: vertical;
  min-height: 50px;
  max-height: 100px;
}
```

- [ ] **Step 3: Create app controller**

```javascript
// public/js/app.js
const APP = {
  currentPage: 'setup',
  sessionId: null,

  init() {
    this.detectPage();
    this.renderPage();
  },

  detectPage() {
    const path = window.location.pathname;
    if (path.includes('/interview/')) {
      this.currentPage = 'interview';
      this.sessionId = path.split('/').pop();
    } else if (path.includes('/review/')) {
      this.currentPage = 'review';
      this.sessionId = path.split('/').pop();
    } else {
      this.currentPage = 'setup';
    }
  },

  renderPage() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    if (this.currentPage === 'setup') {
      SetupPage.render(app);
    } else if (this.currentPage === 'interview') {
      InterviewPage.render(app, this.sessionId);
    } else if (this.currentPage === 'review') {
      ReviewPage.render(app, this.sessionId);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  APP.init();
});
```

- [ ] **Step 4: Create setup page**

```javascript
// public/js/setupPage.js
const SetupPage = {
  state: {
    step: 1,
    jdText: '',
    jobTitle: '',
    level: 'Mid',
    company: '',
    skills: [],
    questionsBySkill: {},
    loading: false,
    error: null
  },

  render(container) {
    container.innerHTML = `
      <div class="container">
        <div class="header">
          <h1>Tạo phỏng vấn với AI</h1>
        </div>
        <div id="setup-content"></div>
      </div>
    `;

    const content = container.querySelector('#setup-content');
    
    if (this.state.step === 1) this.renderStep1(content);
    else if (this.state.step === 2) this.renderStep2(content);
    else if (this.state.step === 3) this.renderStep3(content);
    else if (this.state.step === 4) this.renderStep4(content);
    else if (this.state.step === 5) this.renderStep5(content);
  },

  renderStep1(container) {
    container.innerHTML = `
      <div class="form-group">
        <label>Bước 1: Dán Job Description</label>
        <textarea id="jd-input" placeholder="Dán mô tả công việc..." style="height: 200px;"></textarea>
        ${this.state.error ? `<div class="error">${this.state.error}</div>` : ''}
      </div>
      <button id="next-btn">Tiếp tục</button>
    `;

    const input = container.querySelector('#jd-input');
    const btn = container.querySelector('#next-btn');

    input.value = this.state.jdText;
    input.addEventListener('input', (e) => {
      this.state.jdText = e.target.value;
      btn.disabled = !this.state.jdText.trim();
    });

    btn.disabled = !this.state.jdText.trim();
    btn.addEventListener('click', () => this.nextStep1());
  },

  async nextStep1() {
    this.state.loading = true;
    this.state.error = null;
    this.render(document.getElementById('app'));

    try {
      const response = await fetch('/api/setup/parse-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: this.state.jdText })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      this.state.jobTitle = data.job_title;
      this.state.level = data.level;
      this.state.company = data.company;
      this.state.step = 2;
      this.state.loading = false;
      this.render(document.getElementById('app'));
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      this.render(document.getElementById('app'));
    }
  },

  renderStep2(container) {
    container.innerHTML = `
      <div class="form-group">
        <label>Bước 2: Xác nhận thông tin</label>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 4px;">
          <p><strong>Tên công việc:</strong> ${this.state.jobTitle} <button type="button" class="edit-btn" data-field="jobTitle">Sửa</button></p>
          <p><strong>Level:</strong> ${this.state.level} <button type="button" class="edit-btn" data-field="level">Sửa</button></p>
          <p><strong>Công ty:</strong> ${this.state.company} <button type="button" class="edit-btn" data-field="company">Sửa</button></p>
        </div>
      </div>
      <div style="margin-top: 15px;">
        <button id="back-btn">Quay lại</button>
        <button id="next-btn">Tiếp tục</button>
      </div>
    `;

    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const field = e.target.dataset.field;
        const value = prompt(`Nhập ${field}:`, this.state[field]);
        if (value) this.state[field] = value;
        this.renderStep2(container);
      });
    });

    container.querySelector('#back-btn').addEventListener('click', () => {
      this.state.step = 1;
      this.render(document.getElementById('app'));
    });

    container.querySelector('#next-btn').addEventListener('click', () => this.nextStep2());
  },

  async nextStep2() {
    this.state.loading = true;
    this.render(document.getElementById('app'));

    try {
      const response = await fetch('/api/setup/suggest-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: this.state.jdText })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      this.state.skills = data.skills;
      this.state.step = 3;
      this.state.loading = false;
      this.render(document.getElementById('app'));
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      this.render(document.getElementById('app'));
    }
  },

  renderStep3(container) {
    container.innerHTML = `
      <div class="form-group">
        <label>Bước 3: Danh sách kỹ năng</label>
        <div id="skills-list" style="background: #f9f9f9; padding: 15px; border-radius: 4px;">
          ${this.state.skills.map((skill, i) => `
            <div style="margin-bottom: 10px; display: flex; gap: 10px;">
              <span>${i + 1}.</span>
              <input type="text" value="${skill}" data-index="${i}" class="skill-input" style="flex: 1;">
              <button type="button" class="delete-skill" data-index="${i}">Xoá</button>
            </div>
          `).join('')}
        </div>
        ${this.state.skills.length < 5 ? `<button id="add-skill-btn" style="margin-top: 10px;">+ Thêm kỹ năng</button>` : ''}
      </div>
      <div style="margin-top: 15px;">
        <button id="back-btn">Quay lại</button>
        <button id="next-btn">Tiếp tục</button>
      </div>
    `;

    container.querySelectorAll('.skill-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.state.skills[idx] = e.target.value;
      });
    });

    container.querySelectorAll('.delete-skill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.state.skills.splice(idx, 1);
        this.renderStep3(container);
      });
    });

    const addBtn = container.querySelector('#add-skill-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.state.skills.push('New Skill');
        this.renderStep3(container);
      });
    }

    container.querySelector('#back-btn').addEventListener('click', () => {
      this.state.step = 2;
      this.render(document.getElementById('app'));
    });

    container.querySelector('#next-btn').addEventListener('click', () => this.nextStep3());
  },

  async nextStep3() {
    this.state.loading = true;
    this.render(document.getElementById('app'));

    try {
      const response = await fetch('/api/setup/suggest-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: this.state.jdText,
          skills: this.state.skills,
          job_title: this.state.jobTitle,
          level: this.state.level
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      this.state.questionsBySkill = data.questions_by_skill;
      this.state.step = 4;
      this.state.loading = false;
      this.render(document.getElementById('app'));
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      this.render(document.getElementById('app'));
    }
  },

  renderStep4(container) {
    container.innerHTML = `
      <div class="form-group">
        <label>Bước 4: Kỹ năng & Câu hỏi</label>
        <div id="questions-list">
          ${this.state.skills.map(skill => `
            <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
              <h3>${skill}</h3>
              <div style="margin-left: 15px;">
                ${(this.state.questionsBySkill[skill] || []).map((q, i) => `
                  <div style="margin-bottom: 10px;">
                    <textarea class="question-input" data-skill="${skill}" data-index="${i}" style="width: 100%;">${q}</textarea>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-top: 15px;">
        <button id="back-btn">Quay lại</button>
        <button id="next-btn">Tiếp tục</button>
      </div>
    `;

    container.querySelectorAll('.question-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const skill = e.target.dataset.skill;
        const idx = parseInt(e.target.dataset.index);
        this.state.questionsBySkill[skill][idx] = e.target.value;
      });
    });

    container.querySelector('#back-btn').addEventListener('click', () => {
      this.state.step = 3;
      this.render(document.getElementById('app'));
    });

    container.querySelector('#next-btn').addEventListener('click', () => {
      this.state.step = 5;
      this.render(document.getElementById('app'));
    });
  },

  renderStep5(container) {
    const totalQuestions = Object.values(this.state.questionsBySkill).reduce((sum, qs) => sum + qs.length, 0);
    
    container.innerHTML = `
      <div class="form-group">
        <label>Bước 5: Xem lại & Hoàn tất</label>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 4px;">
          <p><strong>Tên công việc:</strong> ${this.state.jobTitle}</p>
          <p><strong>Level:</strong> ${this.state.level}</p>
          <p><strong>Công ty:</strong> ${this.state.company}</p>
          <p><strong>Kỹ năng:</strong> ${this.state.skills.join(', ')}</p>
          <p><strong>Tổng câu hỏi:</strong> ${totalQuestions}</p>
        </div>
      </div>
      ${this.state.error ? `<div class="error">${this.state.error}</div>` : ''}
      <div style="margin-top: 15px;">
        <button id="back-btn">Quay lại sửa</button>
        <button id="create-btn" ${this.state.loading ? 'disabled' : ''}>
          ${this.state.loading ? '<span class="spinner"></span> Đang tạo...' : 'Tạo link'}
        </button>
      </div>
    `;

    container.querySelector('#back-btn').addEventListener('click', () => {
      this.state.step = 4;
      this.render(document.getElementById('app'));
    });

    container.querySelector('#create-btn').addEventListener('click', () => this.createSession());
  },

  async createSession() {
    this.state.loading = true;
    this.render(document.getElementById('app'));

    try {
      const response = await fetch('/api/setup/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: this.state.jobTitle,
          level: this.state.level,
          company: this.state.company,
          skills: this.state.skills,
          questions_by_skill: this.state.questionsBySkill
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      window.location.href = data.interview_link;
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      this.render(document.getElementById('app'));
    }
  }
};
```

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/css/style.css public/js/app.js public/js/setupPage.js
git commit -m "feat: add frontend setup page with all 5 steps"
```

---

### Task 16: Frontend Interview Page

**Files:**
- Modify: `public/js/interviewPage.js`

- [ ] **Step 1: Create interview page**

```javascript
// public/js/interviewPage.js
const InterviewPage = {
  state: {
    sessionId: null,
    step: 'name-input', // name-input, interview
    candidateName: '',
    messages: [],
    loading: false,
    error: null
  },

  render(container, sessionId) {
    this.state.sessionId = sessionId;
    container.innerHTML = '<div class="container"><div id="interview-content"></div></div>';
    
    const content = container.querySelector('#interview-content');
    
    if (this.state.step === 'name-input') {
      this.renderNameInput(content);
    } else if (this.state.step === 'interview') {
      this.renderInterview(content);
    }
  },

  renderNameInput(container) {
    container.innerHTML = `
      <div class="header">
        <h1>Chuẩn bị cho cuộc phỏng vấn với AI</h1>
      </div>
      <div style="background: #fff; padding: 30px; border-radius: 8px; max-width: 400px; margin: 40px auto;">
        <p style="margin-bottom: 20px;">Vui lòng nhập tên của bạn để chúng tôi bắt đầu</p>
        <div class="form-group">
          <input type="text" id="name-input" placeholder="Tên của bạn..." autofocus>
        </div>
        ${this.state.error ? `<div class="error">${this.state.error}</div>` : ''}
        <button id="start-btn" disabled>Bắt đầu phỏng vấn</button>
      </div>
    `;

    const input = container.querySelector('#name-input');
    const btn = container.querySelector('#start-btn');

    input.addEventListener('input', (e) => {
      this.state.candidateName = e.target.value;
      btn.disabled = !e.target.value.trim();
    });

    btn.addEventListener('click', () => this.startInterview());
  },

  async startInterview() {
    this.state.loading = true;
    
    try {
      const response = await fetch(`/api/interview/${this.state.sessionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_name: this.state.candidateName })
      });
      if (!response.ok) throw new Error('Failed to start interview');

      this.state.step = 'interview';
      this.state.loading = false;
      this.render(document.getElementById('app'), this.state.sessionId);
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      this.render(document.getElementById('app'), this.state.sessionId);
    }
  },

  async renderInterview(container) {
    // Load initial message
    await this.loadFirstQuestion();

    container.innerHTML = `
      <div class="header">
        <h1>Phỏng vấn</h1>
      </div>
      <div class="chat-container">
        <div class="messages" id="messages"></div>
        <div class="input-area">
          <textarea id="answer-input" placeholder="Câu trả lời của bạn..." disabled></textarea>
          <button id="send-btn" disabled>Gửi</button>
        </div>
      </div>
      ${this.state.error ? `<div class="error" style="margin-top: 15px;">${this.state.error}</div>` : ''}
    `;

    this.renderMessages(container);

    const input = container.querySelector('#answer-input');
    const btn = container.querySelector('#send-btn');

    input.disabled = this.state.loading;
    btn.disabled = this.state.loading || !input.value.trim();

    input.addEventListener('input', () => {
      btn.disabled = !input.value.trim();
    });

    btn.addEventListener('click', () => this.sendAnswer(input.value, container));
  },

  async loadFirstQuestion() {
    try {
      const response = await fetch(`/api/interview/${this.state.sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_answer: '' })
      });
      const data = await response.json();
      if (response.ok) {
        this.state.messages.push({ sender: 'ai', content: data.ai_response });
      }
    } catch (error) {
      this.state.error = error.message;
    }
  },

  renderMessages(container) {
    const messagesDiv = container.querySelector('#messages');
    messagesDiv.innerHTML = this.state.messages.map(msg => `
      <div class="message ${msg.sender}">
        ${msg.content}
      </div>
    `).join('');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  },

  async sendAnswer(answer, container) {
    this.state.loading = true;
    this.state.messages.push({ sender: 'candidate', content: answer });
    this.renderMessages(container);

    const input = container.querySelector('#answer-input');
    input.value = '';
    input.disabled = true;

    try {
      const response = await fetch(`/api/interview/${this.state.sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_answer: answer })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      this.state.messages.push({ sender: 'ai', content: data.ai_response });

      if (data.next_action === 'end_interview') {
        window.location.href = `/review/${this.state.sessionId}`;
      } else {
        this.state.loading = false;
        this.renderMessages(container);
        input.disabled = false;
        input.focus();
      }
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      input.disabled = false;
    }
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add public/js/interviewPage.js
git commit -m "feat: add frontend interview page with name input and chat"
```

---

### Task 17: Frontend Review Page

**Files:**
- Create: `public/js/reviewPage.js`

- [ ] **Step 1: Create review page**

```javascript
// public/js/reviewPage.js
const ReviewPage = {
  state: {
    sessionId: null,
    data: null,
    loading: true,
    error: null
  },

  async render(container, sessionId) {
    this.state.sessionId = sessionId;
    container.innerHTML = '<div class="container"><div id="review-content"></div></div>';
    
    await this.loadData();

    const content = container.querySelector('#review-content');
    
    if (this.state.error) {
      content.innerHTML = `<div class="error">${this.state.error}</div>`;
    } else if (this.state.loading) {
      content.innerHTML = '<div class="spinner"></div> Đang tải kết quả...';
    } else {
      this.renderReview(content);
    }
  },

  async loadData() {
    try {
      const response = await fetch(`/api/review/${this.state.sessionId}`);
      if (!response.ok) throw new Error('Failed to load review');
      this.state.data = await response.json();
      this.state.loading = false;
    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
    }
  },

  renderReview(container) {
    const chatHtml = this.state.data.messages
      .map(m => `<div class="message ${m.sender}">${m.content}</div>`)
      .join('');

    const rubricHtml = this.state.data.rubric
      .map(r => `
        <tr>
          <td>${r.skill_name}</td>
          <td>${r.score}/10</td>
          <td>${r.evidence}</td>
        </tr>
      `).join('');

    container.innerHTML = `
      <div class="header">
        <h1>Kết quả phỏng vấn</h1>
        <p>${this.state.data.job_title} - ${this.state.data.candidate_name}</p>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div style="background: #fff; padding: 20px; border-radius: 8px;">
          <h2>Lịch sử chat</h2>
          <div class="chat-container" style="height: 500px; margin-top: 15px;">
            <div class="messages" style="flex: 1; overflow-y: auto;">
              ${chatHtml}
            </div>
          </div>
          <button id="copy-btn" style="margin-top: 15px; width: 100%;">Copy chat</button>
        </div>
        <div style="background: #fff; padding: 20px; border-radius: 8px;">
          <h2>Bảng đánh giá</h2>
          <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #ddd;">
                <th style="text-align: left; padding: 10px;">Kỹ năng</th>
                <th style="text-align: center; padding: 10px;">Điểm</th>
                <th style="text-align: left; padding: 10px;">Bằng chứng</th>
              </tr>
            </thead>
            <tbody>
              ${rubricHtml}
            </tbody>
          </table>
          <div style="margin-top: 20px; display: flex; gap: 10px;">
            <button id="export-pdf-btn" style="flex: 1;">Export PDF</button>
            <button id="export-csv-btn" style="flex: 1;">Export CSV</button>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#copy-btn').addEventListener('click', () => {
      const text = this.state.data.messages.map(m => `${m.sender}: ${m.content}`).join('\n\n');
      navigator.clipboard.writeText(text).then(() => alert('Copied!'));
    });

    container.querySelector('#export-pdf-btn').addEventListener('click', () => this.exportFile('pdf'));
    container.querySelector('#export-csv-btn').addEventListener('click', () => this.exportFile('csv'));
  },

  async exportFile(format) {
    try {
      const response = await fetch(`/api/review/${this.state.sessionId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview.${format}`;
      a.click();
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add public/js/reviewPage.js
git commit -m "feat: add frontend review page with chat display and export options"
```

---

### Task 18: Testing & Setup

**Files:**
- Create: `tests/routes/setup.test.js`
- Create: `jest.config.js`

- [ ] **Step 1: Create Jest config**

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js'],
  testMatch: ['**/tests/**/*.test.js']
};
```

- [ ] **Step 2: Create setup route tests**

```javascript
// tests/routes/setup.test.js
const request = require('supertest');
const express = require('express');
const setupRoutes = require('../../src/routes/setupRoutes');

const app = express();
app.use(express.json());
app.use('/api/setup', setupRoutes);

describe('Setup Routes', () => {
  test('POST /parse-jd returns extracted fields', async () => {
    const response = await request(app)
      .post('/api/setup/parse-jd')
      .send({ jd_text: 'Senior Backend Engineer at Company XYZ' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('job_title');
    expect(response.body).toHaveProperty('level');
    expect(response.body).toHaveProperty('company');
  });

  test('POST /suggest-skills returns skills array', async () => {
    const response = await request(app)
      .post('/api/setup/suggest-skills')
      .send({ jd_text: 'Backend engineer role' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('skills');
    expect(Array.isArray(response.body.skills)).toBe(true);
  });

  test('POST /create-session returns session ID', async () => {
    const response = await request(app)
      .post('/api/setup/create-session')
      .send({
        job_title: 'Engineer',
        level: 'Mid',
        company: 'Company',
        skills: ['Skill1', 'Skill2'],
        questions_by_skill: { 'Skill1': ['Q1'] }
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('session_id');
    expect(response.body).toHaveProperty('interview_link');
  });
});
```

- [ ] **Step 3: Add test script to package.json**

```bash
npm test
```

- [ ] **Step 4: Install test dependencies**

```bash
npm install --save-dev jest supertest
```

- [ ] **Step 5: Commit**

```bash
git add jest.config.js tests/routes/setup.test.js
git commit -m "feat: add Jest tests for setup routes"
```

---

### Task 19: Finalize & Documentation

**Files:**
- Create: `README.md`
- Modify: `src/server.js` (add logging)

- [ ] **Step 1: Create README**

```markdown
# Phỏng vấn với AI (AI Interview App)

A web app for HR to screen candidates via AI-powered interviews.

## Setup

1. Install dependencies: `npm install`
2. Create `.env` file with `QWEN_API_KEY` and other env vars (see `.env.example`)
3. Create `tmp` directory for exports: `mkdir tmp`
4. Start server: `npm run dev` (development) or `npm start` (production)
5. Open http://localhost:3000

## Architecture

- **Backend**: Node.js/Express with SQLite
- **Frontend**: Vanilla HTML/CSS/JS
- **LLM**: Qwen 3.7 Plus API

## Flow

1. **HR Setup** (/setup): Create interview by uploading JD, confirming fields, selecting skills, editing questions
2. **Candidate Interview** (/interview/:sessionId): Chat-based interview with adaptive follow-ups (max 3 per question)
3. **HR Review** (/review/:sessionId): View chat history, AI-generated rubric, export PDF/CSV

## Services

- JD Parser: Extract job title, level, company
- Skills Suggester: Suggest 1-5 skills based on JD
- Question Generator: Generate interview questions per skill
- Interview Engine: State machine for interview flow
- AI Integration: Qwen API wrapper for interview conductor
- Rubric Generator: Generate skill evaluation with scores
- Export Service: PDF and CSV export

## Testing

Run tests: `npm test`
```

- [ ] **Step 2: Update server.js with error handling**

```javascript
// In src/server.js, add error handler:
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

- [ ] **Step 3: Commit**

```bash
git add README.md src/server.js
git commit -m "docs: add README and finalize server setup"
```

---

### Task 20: Build Check & Manual Testing

- [ ] **Step 1: Verify all dependencies installed**

```bash
npm list
```

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Expected output: `Server running on http://localhost:3000`

- [ ] **Step 3: Test HR Setup flow manually**

1. Open http://localhost:3000
2. Paste sample JD
3. Verify fields extracted
4. Verify skills suggested
5. Verify questions generated
6. Create session and get link

- [ ] **Step 4: Test Candidate Interview flow**

1. Open interview link from setup
2. Enter candidate name
3. Verify first question appears
4. Type answer and submit
5. Verify AI response appears
6. Continue through 2-3 questions

- [ ] **Step 5: Test HR Review flow**

1. After interview completes, review page loads
2. Verify chat history displayed
3. Verify rubric table with scores
4. Test PDF export
5. Test CSV export

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: All tests pass (or note which are skipped)

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "build: complete implementation with manual testing"
```

---

## Testing Plan

| Component | Test Type | Command |
|-----------|-----------|---------|
| JD Parser | Unit | `npm test -- jdParser.test.js` |
| Skills Suggester | Unit | `npm test -- skillsSuggester.test.js` |
| Interview Engine | Unit | `npm test -- interviewEngine.test.js` |
| Setup Routes | Integration | `npm test -- setup.test.js` |
| Interview Flow | Manual | Open browser, run full flow |
| Export | Manual | Download PDF, open in reader |

---

## Next Steps (Not in MVP)

- User authentication for HR
- Candidate email invitations
- Interview scheduling
- Analytics dashboard
- Custom rubric templates
- Bulk interview creation
- ATS integration

---

**Implementation complete!**
