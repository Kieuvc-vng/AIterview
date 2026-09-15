# Phase 3: HR Xem Kết Quả Phỏng Vấn — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho HR xem kết quả phỏng vấn ngay trong modal trên trang Job Library — danh sách ứng viên, tóm tắt AI, full chat, export PDF/CSV.

**Architecture:**
- Mở rộng `jobLibraryRoutes.js` + `jobLibraryService.js` thêm 3 API mới (results, remind, export)
- Cập nhật `summaryGenerator.js` thêm hàm tóm tắt toàn bộ interview
- Cập nhật `exportService.js` dùng summaries thay rubrics
- Mở rộng modal trong `library.html` — card layout, accordion, modal-in-modal

**Tech Stack:** Node.js + Express, SQLite (async wrapper), HTML/CSS/JS, PDFKit, csv-writer

## Global Constraints

- Nhánh: `feature/job-library-phase3-frontend`
- Database schema giữ nguyên (5 bảng đã có)
- Gửi email nhắc nhở: giả lập (mock), chưa gửi thật
- Không tạo trang HTML mới — tất cả trong `library.html`
- Patterns: `await dbModule.getDb()` cho DB access, `next({ status, message })` cho error handling

---

## File Structure

**Backend (sửa):**
- `src/services/jobLibraryService.js` — Thêm: `getCandidateResults()`, `getInterviewByCandidateId()`
- `src/services/summaryGenerator.js` — Thêm: `generateAllSummaries()`
- `src/services/exportService.js` — Cập nhật: dùng summaries thay rubrics, thêm mode full chat
- `src/routes/jobLibraryRoutes.js` — Thêm 3 endpoints: results, remind, export

**Frontend (sửa):**
- `public/library.html` — Redesign modal ứng viên: card layout, accordion, full chat modal, export

**Tests (tạo):**
- `tests/candidateResults.test.js` — Test API results + remind
- `tests/exportService.test.js` — Test export summaries + full chat

---

## Task 1: Backend — API lấy kết quả ứng viên + nhắc làm bài

**Files:**
- Modify: `src/services/jobLibraryService.js`
- Modify: `src/routes/jobLibraryRoutes.js`
- Create: `tests/candidateResults.test.js`

**Interfaces:**
- Consumes: `jobLibraryService.getCandidatesByJobId(jobId)` (existing), DB tables `candidates`, `interviews`, `messages`, `summaries`
- Produces:
  - `jobLibraryService.getCandidateResults(candidateId)` → `{ candidate, interview, summaries, messages }`
  - `GET /api/job-library/candidates/:candidateId/results` → JSON response
  - `POST /api/job-library/candidates/:candidateId/remind` → `{ success, message }`

---

- [ ] **Step 1: Write failing test for getCandidateResults**

```javascript
// tests/candidateResults.test.js
const request = require('supertest');
const express = require('express');

// Mock jobLibraryService
jest.mock('../src/services/jobLibraryService', () => ({
  getCandidateResults: jest.fn(),
  getCandidateById: jest.fn()
}));

const jobLibraryService = require('../src/services/jobLibraryService');
const jobLibraryRoutes = require('../src/routes/jobLibraryRoutes');

const app = express();
app.use(express.json());
app.use('/api/job-library', jobLibraryRoutes);

describe('GET /api/job-library/candidates/:candidateId/results', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns candidate results with summaries and messages', async () => {
    jobLibraryService.getCandidateResults.mockResolvedValue({
      candidate: { id: 'cand_1', name: 'Test', email: 'test@test.com', phone: '123', interview_status: 'completed', created_at: '2026-09-15' },
      interview: { id: 'int_1', status: 'completed' },
      summaries: [
        { skill_name: 'Python', question_index: 0, question_text: 'Python experience?', main_answer_summary: '5 years Python', followup_summary: '' }
      ],
      messages: [
        { sender: 'ai', content: 'Tell me about Python', created_at: '2026-09-15T10:00:00' },
        { sender: 'candidate', content: 'I have 5 years', created_at: '2026-09-15T10:01:00' }
      ]
    });

    const res = await request(app).get('/api/job-library/candidates/cand_1/results');
    expect(res.status).toBe(200);
    expect(res.body.candidate.name).toBe('Test');
    expect(res.body.summaries).toHaveLength(1);
    expect(res.body.messages).toHaveLength(2);
  });

  test('returns 404 if candidate not found', async () => {
    jobLibraryService.getCandidateResults.mockResolvedValue(null);
    const res = await request(app).get('/api/job-library/candidates/nonexistent/results');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/job-library/candidates/:candidateId/remind', () => {
  test('returns success with mock email message', async () => {
    jobLibraryService.getCandidateById.mockResolvedValue({
      id: 'cand_1', name: 'Test', email: 'test@test.com'
    });

    const res = await request(app).post('/api/job-library/candidates/cand_1/remind');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('test@test.com');
  });

  test('returns 404 if candidate not found', async () => {
    jobLibraryService.getCandidateById.mockResolvedValue(null);
    const res = await request(app).post('/api/job-library/candidates/nonexistent/remind');
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/candidateResults.test.js --verbose`
Expected: FAIL — `getCandidateResults` not defined, routes not found

- [ ] **Step 3: Add getCandidateResults to jobLibraryService**

Add to `src/services/jobLibraryService.js` before `module.exports`:

```javascript
  async getCandidateById(candidateId) {
    try {
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }
      if (!db) return null;
      const candidate = await db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
      return candidate || null;
    } catch (error) {
      throw new Error(`Failed to fetch candidate: ${error.message}`);
    }
  },

  async getCandidateResults(candidateId) {
    try {
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }
      if (!db) return null;

      const candidate = await db.prepare('SELECT * FROM candidates WHERE id = ?').get(candidateId);
      if (!candidate) return null;

      const interviews = await db.prepare(
        'SELECT * FROM interviews WHERE candidate_id = ? ORDER BY created_at DESC'
      ).all(candidateId);
      const interview = interviews && interviews.length > 0 ? interviews[0] : null;

      let summaries = [];
      let messages = [];

      if (interview) {
        summaries = await db.prepare(
          'SELECT skill_name, question_index, question_text, main_answer_summary, followup_summary FROM summaries WHERE interview_id = ? ORDER BY skill_name, question_index'
        ).all(interview.id);

        messages = await db.prepare(
          'SELECT sender, content, skill_name, created_at FROM messages WHERE interview_id = ? ORDER BY created_at'
        ).all(interview.id);
      }

      return { candidate, interview, summaries: summaries || [], messages: messages || [] };
    } catch (error) {
      throw new Error(`Failed to fetch candidate results: ${error.message}`);
    }
  },
```

Note: `getCandidateById` may already exist — if so, skip adding it. Check before implementing.

- [ ] **Step 4: Add routes to jobLibraryRoutes.js**

Add before `module.exports = router;` in `src/routes/jobLibraryRoutes.js`:

```javascript
// GET /api/job-library/candidates/:candidateId/results - Get interview results
router.get('/candidates/:candidateId/results', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const results = await jobLibraryService.getCandidateResults(candidateId);

    if (!results) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(results);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// POST /api/job-library/candidates/:candidateId/remind - Mock send reminder
router.post('/candidates/:candidateId/remind', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const candidate = await jobLibraryService.getCandidateById(candidateId);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({
      success: true,
      message: `Đã gửi nhắc nhở đến ${candidate.email}`
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest tests/candidateResults.test.js --verbose`
Expected: PASS (all 4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/services/jobLibraryService.js src/routes/jobLibraryRoutes.js tests/candidateResults.test.js
git commit -m "feat: add candidate results and remind APIs for Phase 3"
```

---

## Task 2: Backend — Tóm tắt tự động khi phỏng vấn kết thúc

**Files:**
- Modify: `src/services/summaryGenerator.js`
- Modify: `src/routes/interviewRoutes.js`

**Interfaces:**
- Consumes: `summaryGenerator.generateSummary()` (existing), DB tables `messages`, `summaries`, `interviews`
- Produces: `summaryGenerator.generateAllSummaries(interviewId, db)` — tóm tắt tất cả câu hỏi trong 1 interview, lưu vào bảng `summaries`

---

- [ ] **Step 1: Add generateAllSummaries to summaryGenerator.js**

Add before `module.exports` in `src/services/summaryGenerator.js`:

```javascript
const generateAllSummaries = async (interviewId, db) => {
  try {
    if (!db) {
      console.error('[SummaryGenerator] No database available');
      return [];
    }

    const messages = await db.prepare(
      'SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at'
    ).all(interviewId);

    if (!messages || messages.length === 0) return [];

    const candidateMessages = messages.filter(m => m.sender === 'candidate');
    const aiMessages = messages.filter(m => m.sender === 'ai');

    const summaries = [];

    for (let i = 0; i < aiMessages.length; i++) {
      const question = aiMessages[i];
      const answerIndex = candidateMessages.findIndex(
        m => new Date(m.created_at) > new Date(question.created_at)
      );

      if (answerIndex === -1) continue;

      const answer = candidateMessages[answerIndex];
      const skillName = question.skill_name || 'General';
      const questionIndex = question.question_index || i;

      try {
        const { main_answer_summary, followup_summary } = await generateSummary(
          interviewId,
          skillName,
          questionIndex,
          question.content,
          [{ ...answer, skill_name: skillName, question_index: questionIndex, attempt_number: 1 }]
        );

        const summaryId = 'summary_' + uuidv4();
        await db.prepare(
          'INSERT OR REPLACE INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(summaryId, interviewId, skillName, questionIndex, question.content, main_answer_summary, followup_summary);

        summaries.push({ skill_name: skillName, question_index: questionIndex, main_answer_summary, followup_summary });
      } catch (err) {
        console.error(`[SummaryGenerator] Failed to summarize question ${i}:`, err.message);
      }
    }

    return summaries;
  } catch (error) {
    console.error('[SummaryGenerator] generateAllSummaries error:', error.message);
    return [];
  }
};
```

- [ ] **Step 2: Export generateAllSummaries**

Update `module.exports` in `src/services/summaryGenerator.js`:

```javascript
module.exports = {
  generateSummary,
  summarizeText,
  saveSummary,
  generateAllSummaries
};
```

- [ ] **Step 3: Verify syntax**

Run: `node -c src/services/summaryGenerator.js`
Expected: No output (syntax OK)

- [ ] **Step 4: Commit**

```bash
git add src/services/summaryGenerator.js
git commit -m "feat: add generateAllSummaries for batch summary on interview complete"
```

---

## Task 3: Backend — Export PDF/CSV với summaries

**Files:**
- Modify: `src/services/exportService.js`
- Modify: `src/routes/jobLibraryRoutes.js`
- Create: `tests/exportService.test.js`

**Interfaces:**
- Consumes: `jobLibraryService.getCandidateResults(candidateId)` (from Task 1)
- Produces:
  - `exportService.generateSummaryPDF(candidate, summaries, jobTitle)` → file path
  - `exportService.generateFullChatPDF(candidate, messages, jobTitle)` → file path
  - `exportService.generateSummaryCSV(candidate, summaries, jobTitle)` → file path
  - `exportService.generateFullChatCSV(candidate, messages, jobTitle)` → file path
  - `POST /api/job-library/candidates/:candidateId/export` → file download

---

- [ ] **Step 1: Write failing test for export functions**

```javascript
// tests/exportService.test.js
const { generateSummaryPDF, generateSummaryCSV, generateFullChatPDF, generateFullChatCSV } = require('../src/services/exportService');
const fs = require('fs');

const mockCandidate = { id: 'cand_1', name: 'Nguyen Van A', email: 'a@test.com', phone: '0901234567' };
const mockSummaries = [
  { skill_name: 'Python', question_index: 0, question_text: 'Python experience?', main_answer_summary: '5 years with Django and Flask', followup_summary: '' },
  { skill_name: 'SQL', question_index: 0, question_text: 'SQL knowledge?', main_answer_summary: 'Strong PostgreSQL skills', followup_summary: 'Also familiar with MongoDB' }
];
const mockMessages = [
  { sender: 'ai', content: 'Tell me about Python', created_at: '2026-09-15T10:00:00' },
  { sender: 'candidate', content: 'I have 5 years with Django', created_at: '2026-09-15T10:01:00' }
];
const mockJobTitle = 'Backend Developer';

describe('Export Service - Summary PDF', () => {
  test('generates PDF file', async () => {
    const filePath = await generateSummaryPDF(mockCandidate, mockSummaries, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    fs.unlinkSync(filePath);
  });
});

describe('Export Service - Summary CSV', () => {
  test('generates CSV file', async () => {
    const filePath = await generateSummaryCSV(mockCandidate, mockSummaries, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('Python');
    fs.unlinkSync(filePath);
  });
});

describe('Export Service - Full Chat PDF', () => {
  test('generates PDF file with messages', async () => {
    const filePath = await generateFullChatPDF(mockCandidate, mockMessages, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    fs.unlinkSync(filePath);
  });
});

describe('Export Service - Full Chat CSV', () => {
  test('generates CSV file with messages', async () => {
    const filePath = await generateFullChatCSV(mockCandidate, mockMessages, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('candidate');
    fs.unlinkSync(filePath);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/exportService.test.js --verbose`
Expected: FAIL — functions not exported

- [ ] **Step 3: Rewrite exportService.js with 4 export functions**

Replace content of `src/services/exportService.js`:

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

const getTmpDir = () => {
  const dir = path.join(os.tmpdir(), 'interview-exports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const generateSummaryPDF = async (candidate, summaries, jobTitle) => {
  const filePath = path.join(getTmpDir(), `summary_${candidate.name}_${timestamp()}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text(`Ket Qua Phong Van - Tom Tat`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Ung vien: ${candidate.name}`);
  doc.text(`Email: ${candidate.email} | SĐT: ${candidate.phone}`);
  doc.text(`Vi tri: ${jobTitle}`);
  doc.moveDown();

  let currentSkill = '';
  for (const s of summaries) {
    if (s.skill_name !== currentSkill) {
      currentSkill = s.skill_name;
      doc.moveDown().fontSize(14).text(currentSkill, { underline: true });
    }
    doc.fontSize(11).text(`Q: ${s.question_text}`);
    doc.fontSize(10).text(`A: ${s.main_answer_summary}`);
    if (s.followup_summary) {
      doc.text(`Follow-up: ${s.followup_summary}`);
    }
    doc.moveDown(0.5);
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

const generateFullChatPDF = async (candidate, messages, jobTitle) => {
  const filePath = path.join(getTmpDir(), `fullchat_${candidate.name}_${timestamp()}.pdf`);
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text(`Ket Qua Phong Van - Full Chat`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Ung vien: ${candidate.name}`);
  doc.text(`Email: ${candidate.email} | SĐT: ${candidate.phone}`);
  doc.text(`Vi tri: ${jobTitle}`);
  doc.moveDown();

  for (const m of messages) {
    const label = m.sender === 'ai' ? 'AI' : 'Ung vien';
    doc.fontSize(10).text(`[${label}] ${m.content}`);
    doc.moveDown(0.3);
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

const generateSummaryCSV = async (candidate, summaries, jobTitle) => {
  const filePath = path.join(getTmpDir(), `summary_${candidate.name}_${timestamp()}.csv`);

  const header = 'ung_vien,email,vi_tri,skill,cau_hoi,tom_tat,follow_up\n';
  const rows = summaries.map(s =>
    `"${candidate.name}","${candidate.email}","${jobTitle}","${s.skill_name}","${s.question_text}","${s.main_answer_summary}","${s.followup_summary || ''}"`
  ).join('\n');

  fs.writeFileSync(filePath, header + rows, 'utf8');
  return filePath;
};

const generateFullChatCSV = async (candidate, messages, jobTitle) => {
  const filePath = path.join(getTmpDir(), `fullchat_${candidate.name}_${timestamp()}.csv`);

  const header = 'ung_vien,email,vi_tri,sender,content,time\n';
  const rows = messages.map(m =>
    `"${candidate.name}","${candidate.email}","${jobTitle}","${m.sender}","${(m.content || '').replace(/"/g, '""')}","${m.created_at || ''}"`
  ).join('\n');

  fs.writeFileSync(filePath, header + rows, 'utf8');
  return filePath;
};

const cleanupOldExports = () => {
  try {
    const dir = path.join(os.tmpdir(), 'interview-exports');
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    const oneHourAgo = Date.now() - 3600000;
    for (const file of files) {
      const fp = path.join(dir, file);
      const stat = fs.statSync(fp);
      if (stat.mtimeMs < oneHourAgo) fs.unlinkSync(fp);
    }
  } catch (err) {
    console.error('[Export] Cleanup error:', err.message);
  }
};

module.exports = {
  generateSummaryPDF,
  generateFullChatPDF,
  generateSummaryCSV,
  generateFullChatCSV,
  cleanupOldExports
};
```

- [ ] **Step 4: Add export endpoint to jobLibraryRoutes.js**

Add before `module.exports = router;` in `src/routes/jobLibraryRoutes.js`:

```javascript
const { generateSummaryPDF, generateFullChatPDF, generateSummaryCSV, generateFullChatCSV } = require('../services/exportService');

// POST /api/job-library/candidates/:candidateId/export
router.post('/candidates/:candidateId/export', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { format, content } = req.body;

    if (!format || !content) {
      return res.status(400).json({ error: 'Missing format or content parameter' });
    }

    const results = await jobLibraryService.getCandidateResults(candidateId);
    if (!results) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const jobId = results.candidate.job_id;
    let jobTitle = 'Unknown Position';
    const job = await jobLibraryService.getJobById(jobId);
    if (job) jobTitle = job.job_title;

    let filePath;
    let fileName;

    if (content === 'summary' && format === 'pdf') {
      filePath = await generateSummaryPDF(results.candidate, results.summaries, jobTitle);
      fileName = `tom-tat_${results.candidate.name}.pdf`;
    } else if (content === 'summary' && format === 'csv') {
      filePath = await generateSummaryCSV(results.candidate, results.summaries, jobTitle);
      fileName = `tom-tat_${results.candidate.name}.csv`;
    } else if (content === 'full' && format === 'pdf') {
      filePath = await generateFullChatPDF(results.candidate, results.messages, jobTitle);
      fileName = `full-chat_${results.candidate.name}.pdf`;
    } else if (content === 'full' && format === 'csv') {
      filePath = await generateFullChatCSV(results.candidate, results.messages, jobTitle);
      fileName = `full-chat_${results.candidate.name}.csv`;
    } else {
      return res.status(400).json({ error: 'Invalid format/content combination' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 5: Run tests**

Run: `npx jest tests/exportService.test.js --verbose`
Expected: PASS (all 4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/services/exportService.js src/routes/jobLibraryRoutes.js tests/exportService.test.js
git commit -m "feat: add export PDF/CSV with summary and full chat modes"
```

---

## Task 4: Frontend — Redesign modal ứng viên + tóm tắt + full chat

**Files:**
- Modify: `public/library.html`

**Interfaces:**
- Consumes:
  - `GET /api/job-library/jobs/:id` → `{ job, candidates }` (existing)
  - `GET /api/job-library/candidates/:candidateId/results` → `{ candidate, interview, summaries, messages }` (Task 1)
  - `POST /api/job-library/candidates/:candidateId/remind` → `{ success, message }` (Task 1)
  - `POST /api/job-library/candidates/:candidateId/export` → file download (Task 3)
  - `POST /api/job-library/candidates/:candidateId/generate-link` → `{ interview_link }` (existing)

---

- [ ] **Step 1: Add CSS cho candidate cards, badges, accordion, chat modal**

Add in `<style>` section of `library.html`, after existing styles:

```css
/* Candidate card */
.candidate-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}
.candidate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}
.candidate-name {
  font-weight: 600;
  font-size: 15px;
}
.badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.badge-completed {
  background: #e8f5e9;
  color: #2e7d32;
}
.badge-pending {
  background: #fff3e0;
  color: #e65100;
}
.candidate-meta {
  color: #888;
  font-size: 12px;
  margin-bottom: 0.5rem;
}
.candidate-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.btn-copy { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
.btn-remind { background: #fff3e0; color: #e65100; border: 1px solid #ffe0b2; }
.btn-remind:disabled { background: #f5f5f5; color: #999; border-color: #ddd; cursor: default; }
.btn-export { background: #f3e5f5; color: #7b1fa2; border: 1px solid #e1bee7; }
.btn-expand { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }

/* Accordion */
.summary-accordion {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.summary-accordion.open {
  max-height: 2000px;
}
.summary-section {
  padding: 0.75rem 0;
  border-top: 1px solid #f0f0f0;
}
.skill-group-title {
  font-weight: 600;
  font-size: 13px;
  color: #1565c0;
  margin: 0.75rem 0 0.25rem;
}
.question-item {
  margin-bottom: 0.5rem;
  padding-left: 0.5rem;
}
.question-text {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}
.answer-summary {
  font-size: 12px;
  color: #555;
  margin-top: 2px;
}
.followup-summary {
  font-size: 11px;
  color: #888;
  font-style: italic;
  margin-top: 2px;
}
.summary-loading {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-size: 13px;
}
.summary-empty {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-size: 13px;
}

/* Export dropdown */
.export-dropdown {
  position: relative;
  display: inline-block;
}
.export-menu {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1100;
  min-width: 140px;
  margin-bottom: 4px;
}
.export-menu.show { display: block; }
.export-menu-item {
  padding: 8px 14px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.export-menu-item:hover { background: #f5f5f5; }

/* Full chat modal (modal-in-modal) */
.chat-modal {
  display: none;
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  z-index: 1200;
  justify-content: center;
  align-items: center;
}
.chat-modal.active { display: flex; }
.chat-modal-content {
  background: white;
  border-radius: 10px;
  max-width: 650px;
  width: 95%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}
.chat-modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chat-modal-header h3 { margin: 0; font-size: 16px; }
.chat-modal-body {
  padding: 1rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}
.chat-bubble {
  max-width: 80%;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  font-size: 13px;
  line-height: 1.5;
}
.chat-ai {
  background: #f0f0f0;
  color: #333;
  align-self: flex-start;
  margin-right: auto;
}
.chat-candidate {
  background: #e3f2fd;
  color: #0d47a1;
  align-self: flex-end;
  margin-left: auto;
}
.chat-messages-container {
  display: flex;
  flex-direction: column;
}
.btn-close-chat {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 4px 8px;
}
```

- [ ] **Step 2: Add full chat modal HTML**

Add before closing `</body>` in `library.html`:

```html
<!-- Full Chat Modal -->
<div id="chatModal" class="chat-modal">
  <div class="chat-modal-content">
    <div class="chat-modal-header">
      <h3 id="chatModalTitle">Toàn Bộ Câu Trả Lời</h3>
      <button class="btn-close-chat" onclick="closeChatModal()">&times;</button>
    </div>
    <div class="chat-modal-body">
      <div id="chatMessagesContainer" class="chat-messages-container"></div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Replace JavaScript in library.html — candidate modal logic**

Replace the existing `showCandidatesModal` / candidates-related functions in the `<script>` section. Keep all other existing functions (loadJobs, showCreateJobForm, openJobDetail, etc). Add these new functions:

```javascript
// ===== Phase 3: Candidate Results =====

function showCandidatesModal(jobId, jobTitle) {
  currentJobId = jobId;
  const modal = document.getElementById('candidatesModal');
  const container = document.getElementById('candidatesList');
  container.innerHTML = '<div class="summary-loading">Đang tải danh sách ứng viên...</div>';
  modal.classList.add('active');

  fetch(`/api/job-library/jobs/${jobId}`)
    .then(r => r.json())
    .then(data => {
      const candidates = data.candidates || [];
      if (candidates.length === 0) {
        container.innerHTML = '<div class="summary-empty">Chưa có ứng viên nào. Bấm "Tạo Ứng Viên" để thêm.</div>';
        return;
      }
      container.innerHTML = candidates.map(c => renderCandidateCard(c, jobId, jobTitle)).join('');
    })
    .catch(() => {
      container.innerHTML = '<div class="summary-empty">Lỗi tải danh sách. Vui lòng thử lại.</div>';
    });
}

function renderCandidateCard(candidate, jobId, jobTitle) {
  const isCompleted = candidate.interview_status === 'completed';
  const badgeClass = isCompleted ? 'badge-completed' : 'badge-pending';
  const badgeText = isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành';
  const timeAgo = getTimeAgo(candidate.created_at);

  let actionsHtml = `<button class="btn btn-copy btn-small" onclick="copyTestLink('${candidate.id}', '${jobId}', this)">Copy link test</button>`;

  if (!isCompleted) {
    actionsHtml += `
      <span class="candidate-meta">${timeAgo}</span>
      <button class="btn btn-remind btn-small" onclick="remindCandidate('${candidate.id}', this)">Nhắc làm bài</button>
    `;
  } else {
    actionsHtml += `
      <button class="btn btn-expand btn-small" onclick="toggleSummary('${candidate.id}', '${jobId}')">Xem tóm tắt</button>
      <button class="btn btn-primary btn-small" onclick="openFullChat('${candidate.id}', '${candidate.name}', '${jobTitle}')">Xem toàn bộ câu trả lời</button>
      <div class="export-dropdown">
        <button class="btn btn-export btn-small" onclick="toggleExportMenu('pdf-${candidate.id}')">Xuất PDF ▾</button>
        <div id="pdf-${candidate.id}" class="export-menu">
          <button class="export-menu-item" onclick="exportCandidate('${candidate.id}', 'pdf', 'summary')">Tóm tắt</button>
          <button class="export-menu-item" onclick="exportCandidate('${candidate.id}', 'pdf', 'full')">Full chat</button>
        </div>
      </div>
      <div class="export-dropdown">
        <button class="btn btn-export btn-small" onclick="toggleExportMenu('csv-${candidate.id}')">Xuất CSV ▾</button>
        <div id="csv-${candidate.id}" class="export-menu">
          <button class="export-menu-item" onclick="exportCandidate('${candidate.id}', 'csv', 'summary')">Tóm tắt</button>
          <button class="export-menu-item" onclick="exportCandidate('${candidate.id}', 'csv', 'full')">Full chat</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="candidate-card" id="card-${candidate.id}">
      <div class="candidate-header">
        <span class="candidate-name">${candidate.name}</span>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="candidate-actions">${actionsHtml}</div>
      <div id="summary-${candidate.id}" class="summary-accordion"></div>
    </div>
  `;
}

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Đã gửi hôm nay';
  if (days === 1) return 'Đã gửi hôm qua';
  return `Đã gửi ${days} ngày trước`;
}

function copyTestLink(candidateId, jobId, btn) {
  const link = `${window.location.origin}/interview?job=${jobId}&candidate=${candidateId}`;
  navigator.clipboard.writeText(link).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Đã copy ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2000);
  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = link;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    const original = btn.textContent;
    btn.textContent = 'Đã copy ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2000);
  });
}

function remindCandidate(candidateId, btn) {
  btn.textContent = 'Đang gửi...';
  btn.disabled = true;

  fetch(`/api/job-library/candidates/${candidateId}/remind`, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      btn.textContent = 'Đã gửi ✓';
    })
    .catch(() => {
      btn.textContent = 'Lỗi, thử lại';
      btn.disabled = false;
    });
}

function toggleSummary(candidateId, jobId) {
  const el = document.getElementById(`summary-${candidateId}`);
  if (el.classList.contains('open')) {
    el.classList.remove('open');
    return;
  }

  if (el.dataset.loaded) {
    el.classList.add('open');
    return;
  }

  el.innerHTML = '<div class="summary-loading">Đang tải tóm tắt...</div>';
  el.classList.add('open');

  fetch(`/api/job-library/candidates/${candidateId}/results`)
    .then(r => r.json())
    .then(data => {
      if (!data.summaries || data.summaries.length === 0) {
        el.innerHTML = `<div class="summary-section"><div class="summary-empty">Chưa có tóm tắt. Đang xử lý, vui lòng thử lại sau.<br><button class="btn btn-small btn-secondary" onclick="retrySummary('${candidateId}', '${jobId}')">Thử lại</button></div></div>`;
        return;
      }
      el.innerHTML = renderSummaries(data.summaries);
      el.dataset.loaded = 'true';
    })
    .catch(() => {
      el.innerHTML = '<div class="summary-section"><div class="summary-empty">Lỗi tải tóm tắt. Vui lòng thử lại.</div></div>';
    });
}

function retrySummary(candidateId, jobId) {
  const el = document.getElementById(`summary-${candidateId}`);
  el.dataset.loaded = '';
  toggleSummary(candidateId, jobId);
}

function renderSummaries(summaries) {
  const grouped = {};
  for (const s of summaries) {
    if (!grouped[s.skill_name]) grouped[s.skill_name] = [];
    grouped[s.skill_name].push(s);
  }

  let html = '<div class="summary-section">';
  for (const [skill, items] of Object.entries(grouped)) {
    html += `<div class="skill-group-title">${skill}</div>`;
    for (const item of items) {
      html += `<div class="question-item">`;
      html += `<div class="question-text">Q: ${item.question_text}</div>`;
      html += `<div class="answer-summary">${item.main_answer_summary}</div>`;
      if (item.followup_summary) {
        html += `<div class="followup-summary">Follow-up: ${item.followup_summary}</div>`;
      }
      html += `</div>`;
    }
  }
  html += '</div>';
  return html;
}

function openFullChat(candidateId, candidateName, jobTitle) {
  const modal = document.getElementById('chatModal');
  const title = document.getElementById('chatModalTitle');
  const container = document.getElementById('chatMessagesContainer');

  title.textContent = `${candidateName} — ${jobTitle}`;
  container.innerHTML = '<div class="summary-loading">Đang tải...</div>';
  modal.classList.add('active');

  fetch(`/api/job-library/candidates/${candidateId}/results`)
    .then(r => r.json())
    .then(data => {
      if (!data.messages || data.messages.length === 0) {
        container.innerHTML = '<div class="summary-empty">Chưa có tin nhắn nào.</div>';
        return;
      }
      container.innerHTML = data.messages.map(m =>
        `<div class="chat-bubble ${m.sender === 'ai' ? 'chat-ai' : 'chat-candidate'}">${m.content}</div>`
      ).join('');
    })
    .catch(() => {
      container.innerHTML = '<div class="summary-empty">Lỗi tải dữ liệu.</div>';
    });
}

function closeChatModal() {
  document.getElementById('chatModal').classList.remove('active');
}

function toggleExportMenu(menuId) {
  document.querySelectorAll('.export-menu').forEach(m => {
    if (m.id !== menuId) m.classList.remove('show');
  });
  document.getElementById(menuId).classList.toggle('show');
}

function exportCandidate(candidateId, format, content) {
  document.querySelectorAll('.export-menu').forEach(m => m.classList.remove('show'));

  fetch(`/api/job-library/candidates/${candidateId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, content })
  })
    .then(response => {
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${candidateId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(() => {
      alert('Xuất file thất bại, vui lòng thử lại');
    });
}

// Close export menus when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.export-dropdown')) {
    document.querySelectorAll('.export-menu').forEach(m => m.classList.remove('show'));
  }
});
```

- [ ] **Step 4: Update the candidatesModal HTML**

If the existing candidates modal doesn't have a `candidatesList` container, update the modal markup. Ensure this modal exists in `library.html`:

```html
<div id="candidatesModal" class="modal">
  <div class="modal-content" style="max-width: 700px;">
    <h2>Danh Sách Ứng Viên</h2>
    <div id="candidatesList" style="max-height: 500px; overflow-y: auto;"></div>
    <div class="modal-actions" style="margin-top: 1rem;">
      <button class="btn-secondary" onclick="document.getElementById('candidatesModal').classList.remove('active')">Đóng</button>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Update "Xem Ứng Viên" button onclick in loadJobs**

In the existing `loadJobs()` function, update the "Xem Ứng Viên" button to call `showCandidatesModal(job.id, job.job_title)` instead of the old function.

- [ ] **Step 6: Remove old candidates modal code**

Remove any old candidates display logic (the old modal with URL text input, old showCandidatesModal function, old renderCandidatesList) that conflicts with the new code.

- [ ] **Step 7: Test in browser**

Open `http://localhost:3003/library.html`:
1. Click "Xem Ứng Viên" on a job → modal shows candidate cards with correct status badges
2. For "Chưa hoàn thành": shows time elapsed + "Nhắc làm bài" button works (shows "Đã gửi ✓")
3. "Copy link test" → copies link, shows "Đã copy ✓"
4. For "Đã hoàn thành": "Xem tóm tắt" opens accordion with summaries
5. "Xem toàn bộ câu trả lời" opens full chat modal with chat bubbles
6. Export PDF/CSV dropdown works (download file)
7. Empty state shows "Chưa có ứng viên nào"

- [ ] **Step 8: Commit**

```bash
git add public/library.html
git commit -m "feat: redesign candidate modal with summaries, full chat, and export"
```

---

## Implementation Notes

- **Total Tasks:** 4
- **Dependency Order:** Task 1 → Task 2 (independent) → Task 3 (needs Task 1) → Task 4 (needs Tasks 1+3)
- **Key Checkpoints:** After Task 1 (APIs ready), After Task 3 (export ready), After Task 4 (frontend complete)
- Tasks 1 and 2 can run in parallel. Task 3 depends on Task 1. Task 4 depends on Tasks 1+3.
