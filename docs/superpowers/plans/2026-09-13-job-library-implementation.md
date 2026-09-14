# Job Library & Summarization Implementation Plan

> **Cho workers:**  REQUIRED SUB-SKILL: Dùng superpowers:subagent-driven-development (recommended) hoặc superpowers:executing-plans để implement plan này từng task một.

**Mục tiêu:** Xây dựng thư viện job, quản lý ứng viên, và tóm tắt câu trả lời bằng AI.

**Kiến trúc:** 
- Phase 1: Database schema + migration
- Phase 2: Backend APIs (jobs, candidates, interviews, summaries)
- Phase 3: Services mới (summaryGenerator)
- Phase 4: Frontend (3 pages + modal)

**Tech Stack:** Node.js + Express, SQLite, HTML/CSS/JS, Qwen API

---

## File Structure

**Backend files (sẽ tạo/sửa):**
- `src/db/schema.sql` — Schema mới (5 bảng)
- `src/db/migration.js` — Script migration từ schema cũ
- `src/services/summaryGenerator.js` — Service tóm tắt (NEW)
- `src/services/aiIntegration.js` — Cập nhật (bỏ scoring)
- `src/routes/jobRoutes.js` — APIs job library (NEW)
- `src/routes/candidateRoutes.js` — APIs candidate (NEW)
- `src/routes/interviewRoutes.js` — Cập nhật (thêm interview APIs)
- `src/server.js` — Cập nhật (import jobRoutes, candidateRoutes)

**Frontend files (sẽ tạo/sửa):**
- `public/library.html` — Trang 1: Thư viện job (NEW)
- `public/sendToCandidate.js` — Modal popup gửi ứng viên (NEW)
- `public/reviewPage.html` — Trang review kết quả (Cập nhật)
- `public/styles.css` — Cập nhật style cho trang mới

**Tests:**
- `tests/summaryGenerator.test.js` — Test summaryGenerator (NEW)
- `tests/jobRoutes.test.js` — Test job APIs (NEW)
- `tests/candidateRoutes.test.js` — Test candidate APIs (NEW)

---

## PHASE 1: Database Schema & Migration

### Task 1: Tạo schema.sql mới (5 bảng)

**Files:**
- Create: `src/db/schema.sql`

- [ ] **Step 1: Viết file schema.sql mới**

```sql
-- Job Library & Summarization Schema
-- Created: 2026-09-13

-- 1. JOBS Table (Job Templates)
CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY,
  job_title TEXT NOT NULL,
  level TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  skills TEXT NOT NULL,
  questions_by_skill TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CANDIDATES Table
CREATE TABLE IF NOT EXISTS candidates (
  candidate_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id)
);

-- 3. INTERVIEWS Table
CREATE TABLE IF NOT EXISTS interviews (
  interview_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  status TEXT DEFAULT 'setup',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id)
);

-- 4. MESSAGES Table (updated FK)
CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  skill_name TEXT,
  question_index INTEGER,
  attempt_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interview_id) REFERENCES interviews(interview_id)
);

-- 5. SUMMARIES Table (NEW)
CREATE TABLE IF NOT EXISTS summaries (
  summary_id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  main_answer_summary TEXT,
  followup_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interview_id) REFERENCES interviews(interview_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_messages_interview_id ON messages(interview_id);
CREATE INDEX IF NOT EXISTS idx_summaries_interview_id ON summaries(interview_id);
```

- [ ] **Step 2: Verify file created**

Run: `ls -la src/db/schema.sql`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.sql
git commit -m "feat: create new schema with jobs, candidates, interviews, summaries tables"
```

---

### Task 2: Tạo migration script

**Files:**
- Create: `src/db/migration.js`

- [ ] **Step 1: Viết migration script**

```javascript
// src/db/migration.js
const sqlite3 = require('better-sqlite3');
const fs = require('fs');

const db = sqlite3(process.env.DATABASE_URL || './app.db');

const migrate = () => {
  console.log('Starting migration...');

  // Step 1: Backup old tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions_backup AS SELECT * FROM sessions;
    CREATE TABLE IF NOT EXISTS rubrics_backup AS SELECT * FROM rubrics;
  `);
  console.log('✓ Backup created');

  // Step 2: Create new tables
  const schema = fs.readFileSync('src/db/schema.sql', 'utf8');
  db.exec(schema);
  console.log('✓ New schema created');

  // Step 3: Migrate SESSIONS → JOBS, CANDIDATES, INTERVIEWS
  db.exec(`
    -- Create JOBS from unique (job_title, level, company) in sessions
    INSERT INTO jobs (job_id, job_title, level, company, skills, questions_by_skill, created_by, created_at)
    SELECT 
      'job_' || rowid,
      job_title,
      level,
      company,
      skills,
      questions_by_skill,
      'migrated@app.com',
      CURRENT_TIMESTAMP
    FROM (
      SELECT DISTINCT job_title, level, company, skills, questions_by_skill
      FROM sessions_backup
    );

    -- Create CANDIDATES from sessions (one per unique candidate)
    INSERT INTO candidates (candidate_id, job_id, name, email, phone, created_at)
    SELECT 
      'candidate_' || rowid,
      j.job_id,
      s.candidate_name,
      'candidate_' || rowid || '@app.com',
      '+000000000',
      s.created_at
    FROM sessions_backup s
    JOIN jobs j ON s.job_title = j.job_title AND s.level = j.level AND s.company = j.company;

    -- Create INTERVIEWS from sessions (rename to interview_id, add FKs)
    INSERT INTO interviews (interview_id, job_id, candidate_id, status, started_at, completed_at, created_at)
    SELECT 
      s.session_id,
      j.job_id,
      c.candidate_id,
      s.status,
      NULL,
      NULL,
      s.created_at
    FROM sessions_backup s
    JOIN jobs j ON s.job_title = j.job_title AND s.level = j.level AND s.company = j.company
    JOIN candidates c ON j.job_id = c.job_id AND s.candidate_name = c.name;
  `);
  console.log('✓ SESSIONS migrated to JOBS, CANDIDATES, INTERVIEWS');

  // Step 4: Migrate MESSAGES (rename FK)
  db.exec(`
    -- Messages table already exists, just update FK reference in app code
    -- Data migration happens via session_id → interview_id mapping
  `);
  console.log('✓ MESSAGES table ready (FK will update via interview_id)');

  // Step 5: Archive RUBRICS
  db.exec(`
    CREATE TABLE IF NOT EXISTS rubrics_archive AS SELECT * FROM rubrics_backup;
    DROP TABLE IF EXISTS rubrics;
  `);
  console.log('✓ RUBRICS archived and removed');

  console.log('✓ Migration completed successfully');
};

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
```

- [ ] **Step 2: Test migration logic (dry-run)**

Run: `node src/db/migration.js`
Expected: "Migration completed successfully"

- [ ] **Step 3: Commit**

```bash
git add src/db/migration.js
git commit -m "feat: create migration script from old schema to new"
```

---

## PHASE 2: Backend APIs & Services

### Task 3: Tạo jobRoutes.js (CRUD jobs)

**Files:**
- Create: `src/routes/jobRoutes.js`

- [ ] **Step 1: Viết jobRoutes.js**

```javascript
// src/routes/jobRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Assume sessionManager singleton imported
const sessionManager = require('../services/sessionManager');

// GET /jobs - List all jobs
router.get('/', (req, res) => {
  try {
    const jobs = sessionManager.getJobs();
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /jobs/:job_id - Get job detail
router.get('/:job_id', (req, res) => {
  try {
    const job = sessionManager.getJob(req.params.job_id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /jobs - Save job to library
router.post('/', (req, res) => {
  try {
    const { job_title, level, company, description, skills, questions_by_skill, created_by } = req.body;

    if (!job_title || !level || !company || !skills || !questions_by_skill) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const job_id = 'job_' + uuidv4();
    const job = {
      job_id,
      job_title,
      level,
      company,
      description: description || '',
      skills: JSON.stringify(skills),
      questions_by_skill: JSON.stringify(questions_by_skill),
      created_by: created_by || 'unknown@app.com',
      created_at: new Date().toISOString()
    };

    sessionManager.saveJob(job);
    res.json({ success: true, job_id, message: 'Job saved to library' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /jobs/:job_id - Update job
router.put('/:job_id', (req, res) => {
  try {
    const job_id = req.params.job_id;
    const updates = req.body;

    sessionManager.updateJob(job_id, updates);
    res.json({ success: true, message: 'Job updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /jobs/:job_id - Delete job
router.delete('/:job_id', (req, res) => {
  try {
    sessionManager.deleteJob(req.params.job_id);
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verify syntax**

Run: `node -c src/routes/jobRoutes.js`
Expected: No output (syntax OK)

- [ ] **Step 3: Commit**

```bash
git add src/routes/jobRoutes.js
git commit -m "feat: add job library APIs (CRUD)"
```

---

### Task 4: Tạo candidateRoutes.js

**Files:**
- Create: `src/routes/candidateRoutes.js`

- [ ] **Step 1: Viết candidateRoutes.js**

```javascript
// src/routes/candidateRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const sessionManager = require('../services/sessionManager');

// GET /jobs/:job_id/candidates - List candidates for a job
router.get('/job/:job_id', (req, res) => {
  try {
    const candidates = sessionManager.getCandidatesByJob(req.params.job_id);
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /candidates - Create new candidate
router.post('/', (req, res) => {
  try {
    const { job_id, name, email, phone } = req.body;

    if (!job_id || !name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const candidate_id = 'candidate_' + uuidv4();
    const candidate = {
      candidate_id,
      job_id,
      name,
      email,
      phone,
      created_at: new Date().toISOString()
    };

    sessionManager.saveCandidate(candidate);
    res.json({ success: true, candidate_id, message: 'Candidate created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /candidates/:candidate_id
router.get('/:candidate_id', (req, res) => {
  try {
    const candidate = sessionManager.getCandidate(req.params.candidate_id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
    res.json({ success: true, candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Verify syntax**

Run: `node -c src/routes/candidateRoutes.js`
Expected: No output

- [ ] **Step 3: Commit**

```bash
git add src/routes/candidateRoutes.js
git commit -m "feat: add candidate management APIs"
```

---

### Task 5: Tạo summaryGenerator.js service

**Files:**
- Create: `src/services/summaryGenerator.js`

- [ ] **Step 1: Viết summaryGenerator.js**

```javascript
// src/services/summaryGenerator.js
const { callQwen } = require('./qwenClient');
const { v4: uuidv4 } = require('uuid');

const generateSummary = async (interview_id, skill_name, question_index, question_text, messages) => {
  try {
    // Filter messages for this question
    const relevantMessages = messages.filter(
      m => m.skill_name === skill_name && m.question_index === question_index
    );

    if (relevantMessages.length === 0) {
      return { main_answer_summary: '', followup_summary: '' };
    }

    // Separate main answer from follow-ups
    const mainAnswerMessages = relevantMessages.filter(m => m.attempt_number === 1);
    const followupMessages = relevantMessages.filter(m => m.attempt_number > 1);

    // Generate main answer summary
    let main_answer_summary = '';
    if (mainAnswerMessages.length > 0) {
      const mainContent = mainAnswerMessages.map(m => m.content).join('\n');
      main_answer_summary = await summarizeText(question_text, mainContent);
    }

    // Generate follow-up summary
    let followup_summary = '';
    if (followupMessages.length > 0) {
      const followupContent = followupMessages.map(m => m.content).join('\n');
      followup_summary = await summarizeText('Follow-up responses', followupContent);
    }

    return { main_answer_summary, followup_summary };
  } catch (error) {
    console.error('Summary generation error:', error);
    return { main_answer_summary: '', followup_summary: '' };
  }
};

const summarizeText = async (question, answer) => {
  const systemPrompt = `Tóm tắt câu trả lời thành 1-2 dòng. Tập trung vào kỹ năng chính. Ngắn gọn và trung thực.`;
  
  const messages = [
    {
      role: 'user',
      content: `Câu hỏi: ${question}\n\nCâu trả lời: ${answer}\n\nTóm tắt:`
    }
  ];

  const response = await callQwen(messages, systemPrompt);
  return response.trim();
};

const saveSummary = (db, summary_id, interview_id, skill_name, question_index, question_text, main_summary, followup_summary) => {
  const stmt = db.prepare(`
    INSERT INTO summaries (summary_id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(summary_id, interview_id, skill_name, question_index, question_text, main_summary, followup_summary);
};

module.exports = {
  generateSummary,
  summarizeText,
  saveSummary
};
```

- [ ] **Step 2: Verify syntax**

Run: `node -c src/services/summaryGenerator.js`
Expected: No output

- [ ] **Step 3: Commit**

```bash
git add src/services/summaryGenerator.js
git commit -m "feat: add summary generator service"
```

---

### Task 6: Update sessionManager để support jobs, candidates, interviews

**Files:**
- Modify: `src/services/sessionManager.js`

- [ ] **Step 1: Thêm methods cho jobs**

```javascript
// Thêm vào sessionManager.js:

const getJobs = () => {
  const stmt = db.prepare('SELECT * FROM jobs');
  return stmt.all();
};

const getJob = (job_id) => {
  const stmt = db.prepare('SELECT * FROM jobs WHERE job_id = ?');
  return stmt.get(job_id);
};

const saveJob = (job) => {
  const stmt = db.prepare(`
    INSERT INTO jobs (job_id, job_title, level, company, description, skills, questions_by_skill, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(job.job_id, job.job_title, job.level, job.company, job.description, job.skills, job.questions_by_skill, job.created_by, job.created_at);
};

const updateJob = (job_id, updates) => {
  const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  const stmt = db.prepare(`UPDATE jobs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE job_id = ?`);
  stmt.run(...values, job_id);
};

const deleteJob = (job_id) => {
  const stmt = db.prepare('DELETE FROM jobs WHERE job_id = ?');
  stmt.run(job_id);
};

// Thêm methods cho candidates
const getCandidatesByJob = (job_id) => {
  const stmt = db.prepare('SELECT * FROM candidates WHERE job_id = ?');
  return stmt.all(job_id);
};

const getCandidate = (candidate_id) => {
  const stmt = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?');
  return stmt.get(candidate_id);
};

const saveCandidate = (candidate) => {
  const stmt = db.prepare(`
    INSERT INTO candidates (candidate_id, job_id, name, email, phone, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(candidate.candidate_id, candidate.job_id, candidate.name, candidate.email, candidate.phone, candidate.created_at);
};

// Thêm methods cho interviews
const createInterview = (interview_id, job_id, candidate_id) => {
  const stmt = db.prepare(`
    INSERT INTO interviews (interview_id, job_id, candidate_id, status, created_at)
    VALUES (?, ?, ?, 'setup', CURRENT_TIMESTAMP)
  `);
  stmt.run(interview_id, job_id, candidate_id);
};

const getInterview = (interview_id) => {
  const stmt = db.prepare('SELECT * FROM interviews WHERE interview_id = ?');
  return stmt.get(interview_id);
};
```

- [ ] **Step 2: Export new methods**

```javascript
// Add to module.exports:
module.exports = {
  ...existing methods...,
  getJobs,
  getJob,
  saveJob,
  updateJob,
  deleteJob,
  getCandidatesByJob,
  getCandidate,
  saveCandidate,
  createInterview,
  getInterview
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/sessionManager.js
git commit -m "feat: add job, candidate, interview methods to sessionManager"
```

---

### Task 7: Update server.js để import new routes

**Files:**
- Modify: `src/server.js`

- [ ] **Step 1: Import new routes**

```javascript
// Thêm ở đầu file (sau các require khác):
const jobRoutes = require('./routes/jobRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
```

- [ ] **Step 2: Register routes**

```javascript
// Thêm ở giữa file (sau khi app = express()):
app.use('/jobs', jobRoutes);
app.use('/candidates', candidateRoutes);
```

- [ ] **Step 3: Test server starts**

Run: `npm start`
Expected: Server starts without errors

- [ ] **Step 4: Commit**

```bash
git add src/server.js
git commit -m "feat: register job and candidate routes"
```

---

## PHASE 3: Frontend - Trang 1 & 2

### Task 8: Tạo library.html (Trang 1)

**Files:**
- Create: `public/library.html`

- [ ] **Step 1: Viết library.html**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Job Library | AIterview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; }
    header { background: white; padding: 1rem 2rem; border-bottom: 1px solid #eee; }
    .container { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; }
    .job-card { background: white; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .job-info h3 { margin-bottom: 0.5rem; }
    .job-info p { color: #666; font-size: 14px; }
    .actions { display: flex; gap: 0.5rem; }
    button { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
    .btn-primary { background: #2196f3; color: white; }
    .btn-secondary { background: #f5f5f5; color: #333; border: 1px solid #ddd; }
    .btn-create { background: #4caf50; color: white; padding: 0.7rem 1.5rem; font-size: 16px; margin-top: 2rem; }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000; }
    .modal.active { display: flex; }
    .modal-content { background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%; }
    .modal-content h2 { margin-bottom: 1rem; }
    .modal-content input { width: 100%; padding: 0.7rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
  </style>
</head>
<body>
  <header>
    <h1>📚 Thư Viện Job</h1>
  </header>

  <div class="container">
    <div id="jobsList"></div>
    <button class="btn-create" onclick="showCreateJobForm()">+ Tạo Job Mới</button>
  </div>

  <div id="sendModal" class="modal">
    <div class="modal-content">
      <h2>Gửi cho Ứng Viên</h2>
      <input type="text" id="candidateName" placeholder="Tên ứng viên" />
      <input type="email" id="candidateEmail" placeholder="Email" />
      <input type="tel" id="candidatePhone" placeholder="Số điện thoại" />
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeSendModal()">Hủy</button>
        <button class="btn-primary" onclick="generateLink()">Tạo Link</button>
      </div>
    </div>
  </div>

  <script>
    let currentJobId = null;

    // Load jobs on page load
    document.addEventListener('DOMContentLoaded', loadJobs);

    function loadJobs() {
      fetch('/jobs')
        .then(r => r.json())
        .then(data => {
          const list = document.getElementById('jobsList');
          if (data.jobs.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #666;">Chưa có job nào. Tạo job mới!</p>';
            return;
          }
          list.innerHTML = data.jobs.map(job => `
            <div class="job-card">
              <div class="job-info">
                <h3>${job.job_title} (${job.level})</h3>
                <p>${job.company} · ${JSON.parse(job.skills || '[]').length} skills</p>
              </div>
              <div class="actions">
                <button class="btn-primary" onclick="openSendModal('${job.job_id}')">Gửi cho Ứng Viên</button>
                <button class="btn-secondary">Chỉnh Sửa</button>
              </div>
            </div>
          `).join('');
        });
    }

    function openSendModal(jobId) {
      currentJobId = jobId;
      document.getElementById('sendModal').classList.add('active');
    }

    function closeSendModal() {
      document.getElementById('sendModal').classList.remove('active');
    }

    function generateLink() {
      const name = document.getElementById('candidateName').value;
      const email = document.getElementById('candidateEmail').value;
      const phone = document.getElementById('candidatePhone').value;

      if (!name || !email || !phone) {
        alert('Điền đầy đủ thông tin!');
        return;
      }

      fetch('/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: currentJobId, name, email, phone })
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            const interviewLink = `${window.location.origin}/interview?token=${data.candidate_id}`;
            alert(`Link tạo thành công:\n\n${interviewLink}`);
            closeSendModal();
            document.getElementById('candidateName').value = '';
            document.getElementById('candidateEmail').value = '';
            document.getElementById('candidatePhone').value = '';
          }
        });
    }

    function showCreateJobForm() {
      alert('Tạo job mới: Chuyển sang trang Setup (sẽ implement sau)');
    }
  </script>
</body>
</html>
```

- [ ] **Step 2: Test file created**

Run: `ls -la public/library.html`
Expected: File exists

- [ ] **Step 3: Commit**

```bash
git add public/library.html
git commit -m "feat: add job library page"
```

---

### Task 9: Update interviewRoutes để support summaries

**Files:**
- Modify: `src/routes/interviewRoutes.js`

- [ ] **Step 1: Thêm POST /summaries endpoint**

```javascript
// Thêm vào interviewRoutes.js:

const summaryGenerator = require('../services/summaryGenerator');
const { v4: uuidv4 } = require('uuid');

// POST /interviews/:interview_id/message - Gửi tin nhắn + tóm tắt
router.post('/:interview_id/message', async (req, res) => {
  try {
    const { interview_id } = req.params;
    const { content, sender } = req.body;

    // Save message
    const messageId = 'msg_' + uuidv4();
    sessionManager.addMessage(interview_id, messageId, sender, content);

    // Nếu là candidate answer - generate summary
    if (sender === 'candidate') {
      const interview = sessionManager.getInterview(interview_id);
      const job = sessionManager.getJob(interview.job_id);
      const messages = sessionManager.getInterviewMessages(interview_id);

      // Get current question context (simplified - từ last message)
      const lastQuestion = messages.find(m => m.sender === 'interviewer');
      if (lastQuestion) {
        const { main_answer_summary, followup_summary } = await summaryGenerator.generateSummary(
          interview_id,
          'skill', // simplified
          0,
          lastQuestion.content,
          messages
        );

        // Save summary
        const summaryId = 'summary_' + uuidv4();
        summaryGenerator.saveSummary(
          sessionManager.db,
          summaryId,
          interview_id,
          'skill',
          0,
          lastQuestion.content,
          main_answer_summary,
          followup_summary
        );
      }
    }

    res.json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /summaries/:interview_id - Lấy tóm tắt
router.get('/:interview_id/summaries', (req, res) => {
  try {
    const summaries = sessionManager.getSummaries(req.params.interview_id);
    res.json({ success: true, summaries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/interviewRoutes.js
git commit -m "feat: add summary generation to interview message endpoint"
```

---

## PHASE 4: Testing & Final Touches

### Task 10: Write tests for summaryGenerator

**Files:**
- Create: `tests/summaryGenerator.test.js`

- [ ] **Step 1: Write tests**

```javascript
// tests/summaryGenerator.test.js
const summaryGenerator = require('../src/services/summaryGenerator');

describe('summaryGenerator', () => {
  test('generateSummary should return empty if no messages', async () => {
    const result = await summaryGenerator.generateSummary('int1', 'Python', 0, 'Python?', []);
    expect(result.main_answer_summary).toBe('');
    expect(result.followup_summary).toBe('');
  });

  test('generateSummary should filter relevant messages', async () => {
    const messages = [
      { skill_name: 'Python', question_index: 0, attempt_number: 1, content: '5 years' },
      { skill_name: 'SQL', question_index: 1, attempt_number: 1, content: 'SQL content' }
    ];
    const result = await summaryGenerator.generateSummary('int1', 'Python', 0, 'Python?', messages);
    // Should only summarize Python messages
    expect(result).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test -- tests/summaryGenerator.test.js`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/summaryGenerator.test.js
git commit -m "test: add tests for summary generator"
```

---

### Task 11: Migration testing

**Files:**
- No new files (integration test)

- [ ] **Step 1: Create test database**

Run: `cp app.db app.db.backup && rm app.db && npm start`
Expected: Server starts, creates new schema

- [ ] **Step 2: Test job creation**

Run curl:
```bash
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Test Job",
    "level": "Mid",
    "company": "TestCo",
    "skills": ["Python"],
    "questions_by_skill": {"Python": ["Q1"]},
    "created_by": "test@app.com"
  }'
```
Expected: `{"success": true, "job_id": "job_..."}`

- [ ] **Step 3: Test candidate creation**

Run curl:
```bash
curl -X POST http://localhost:3000/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "job_...",
    "name": "John",
    "email": "john@test.com",
    "phone": "+1234567890"
  }'
```
Expected: `{"success": true, "candidate_id": "candidate_..."}`

- [ ] **Step 4: Verify database**

Run: `sqlite3 app.db ".tables"`
Expected: All 5 tables present

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify migration and API integration"
```

---

### Task 12: Final cleanup & documentation

**Files:**
- No new files

- [ ] **Step 1: Update .env.example**

```
SETUP_MODEL=qwen-3.7-plus
INTERVIEW_MODEL=qwen-3.7-plus
INTERVIEW_MODEL_BACKUP=qwen-3.6-plus
SUMMARY_MODEL=qwen-3.7-plus
SUMMARY_MODEL_BACKUP=qwen-3.6-plus
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add model config to .env.example"
```

- [ ] **Step 3: Verify all tests pass**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: finalize job library implementation"
```

---

## Implementation Notes

- **Total Tasks:** 12
- **Estimated Time:** 4-5 days
- **Dependency Order:** Database → Backend → Frontend
- **Key Checkpoints:** After Task 6 (APIs ready), After Task 9 (summaries integrated), After Task 11 (full integration test)

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-13-job-library-implementation.md`.**

**Hai cách để execute:**

**1. Subagent-Driven (Recommended)**
- Mình dispatch subagent cho mỗi task, review giữa các tasks
- Nhanh hơn, dễ debug

**2. Inline Execution**
- Execute task-by-task trong session này
- Batch execution với checkpoints

**Bạn muốn cách nào?**