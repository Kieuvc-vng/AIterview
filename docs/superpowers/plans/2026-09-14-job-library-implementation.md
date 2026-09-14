# Job Library Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Job Library where HR can save interview jobs, manage candidates, and generate interview links for each candidate.

**Architecture:** 
1. Extend database with Job and Candidate tables
2. Create job library API endpoints (list, get, create, update, delete jobs; add candidates)
3. Build Job Library frontend page (list jobs with actions)
4. Build Job Detail page (view job + candidate list with interview link generation)
5. Modify setupRoutes createSession to save job → redirect to library

**Tech Stack:** Node.js + Express, SQLite (in-memory fallback), Vanilla JS frontend

---

## File Structure

**Database:**
- `src/db/schema.sql` - Add/modify: `jobs`, `candidates` tables

**Backend Services:**
- `src/services/jobLibraryService.js` (create) - Job/Candidate management logic
- `src/routes/jobLibraryRoutes.js` (create) - API endpoints: GET /jobs, GET /jobs/:id, POST /jobs/:id/candidates, etc.
- `src/routes/setupRoutes.js` (modify) - Change createSession to save job to library

**Frontend Pages:**
- `public/js/jobLibraryPage.js` (create) - List jobs, render actions (View/Edit/Delete/Add Candidate)
- `public/js/jobDetailPage.js` (create) - Show job details + candidate list with generate link button
- `public/js/setupPage.js` (modify) - Change redirect from interview to library
- `public/js/app.js` (modify) - Add route to library/detail pages
- `public/css/style.css` (modify) - Add styles for library/detail pages

**Tests:**
- `tests/services/jobLibraryService.test.js` (create)
- `tests/routes/jobLibraryRoutes.test.js` (create)

---

## Tasks

### Task 1: Database Schema - Create Job and Candidate tables

**Files:**
- Modify: `src/db/schema.sql`

- [ ] **Step 1: Open schema.sql and view current tables**

Run: `cat src/db/schema.sql`

Expected: See current jobs table structure (if exists) and other tables

- [ ] **Step 2: Add/modify jobs table (if needed)**

Replace/add to `src/db/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  hr_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  level TEXT NOT NULL,
  company TEXT NOT NULL,
  skills TEXT NOT NULL, -- JSON array as string
  questions_by_skill TEXT NOT NULL, -- JSON object as string
  jd_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 3: Add candidates table**

Add to `src/db/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  link_sent BOOLEAN DEFAULT 0,
  interview_status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  interview_link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
```

- [ ] **Step 4: Verify schema syntax**

Run: `sqlite3 :memory: < src/db/schema.sql`

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.sql
git commit -m "feat: add jobs and candidates tables schema"
```

---

### Task 2: Job Library Service - Create core business logic

**Files:**
- Create: `src/services/jobLibraryService.js`

- [ ] **Step 1: Create jobLibraryService.js with getJobs function**

Create `src/services/jobLibraryService.js`:

```javascript
const db = require('./sessionManager'); // Reuse sessionManager for DB access

const jobLibraryService = {
  // Get all jobs for HR
  async getJobs(hrEmail) {
    const jobs = await db.query(
      'SELECT id, job_title, level, company, created_at, (SELECT COUNT(*) FROM candidates WHERE job_id = jobs.id) as candidate_count FROM jobs WHERE hr_email = ? ORDER BY created_at DESC',
      [hrEmail]
    );
    return jobs || [];
  },

  // Get job by ID with full details
  async getJobById(jobId) {
    const job = await db.query(
      'SELECT * FROM jobs WHERE id = ?',
      [jobId]
    );
    if (!job || job.length === 0) return null;
    
    const jobData = job[0];
    jobData.skills = JSON.parse(jobData.skills || '[]');
    jobData.questions_by_skill = JSON.parse(jobData.questions_by_skill || '{}');
    
    return jobData;
  },

  // Save job to library (called after Step 5)
  async createJob(jobData) {
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    await db.query(
      'INSERT INTO jobs (id, hr_email, job_title, level, company, skills, questions_by_skill, jd_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        jobId,
        jobData.hr_email,
        jobData.job_title,
        jobData.level,
        jobData.company,
        JSON.stringify(jobData.skills),
        JSON.stringify(jobData.questions_by_skill),
        jobData.jd_text
      ]
    );
    
    return jobId;
  },

  // Delete job
  async deleteJob(jobId) {
    await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);
    return true;
  }
};

module.exports = jobLibraryService;
```

- [ ] **Step 2: Add getCandidatesByJobId function**

Add to jobLibraryService:

```javascript
async getCandidatesByJobId(jobId) {
  const candidates = await db.query(
    'SELECT id, name, phone, email, link_sent, interview_status FROM candidates WHERE job_id = ? ORDER BY created_at',
    [jobId]
  );
  return candidates || [];
}
```

- [ ] **Step 3: Add addCandidate function**

Add to jobLibraryService:

```javascript
async addCandidate(jobId, candidateData) {
  const candidateId = 'cand_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  await db.query(
    'INSERT INTO candidates (id, job_id, name, phone, email) VALUES (?, ?, ?, ?, ?)',
    [candidateId, jobId, candidateData.name, candidateData.phone, candidateData.email]
  );
  
  return candidateId;
}
```

- [ ] **Step 4: Add generateInterviewLink function**

Add to jobLibraryService:

```javascript
async generateInterviewLink(jobId, candidateId) {
  // Generate simple link: /interview?job={jobId}&candidate={candidateId}
  const interviewLink = `/interview?job=${jobId}&candidate=${candidateId}`;
  
  await db.query(
    'UPDATE candidates SET link_sent = 1, interview_link = ? WHERE id = ?',
    [interviewLink, candidateId]
  );
  
  return interviewLink;
}
```

- [ ] **Step 5: Add deleteCandidate function**

Add to jobLibraryService:

```javascript
async deleteCandidate(candidateId) {
  await db.query('DELETE FROM candidates WHERE id = ?', [candidateId]);
  return true;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/services/jobLibraryService.js
git commit -m "feat: create job library service with CRUD operations"
```

---

### Task 3: API Routes - Create endpoints

**Files:**
- Create: `src/routes/jobLibraryRoutes.js`

- [ ] **Step 1: Create jobLibraryRoutes.js with GET /jobs endpoint**

Create `src/routes/jobLibraryRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const jobLibraryService = require('../services/jobLibraryService');

// GET /api/job-library/jobs - List all jobs for HR
router.get('/jobs', async (req, res, next) => {
  try {
    const { hr_email } = req.query;
    if (!hr_email) {
      return res.status(400).json({ error: 'Missing hr_email' });
    }
    
    const jobs = await jobLibraryService.getJobs(hr_email);
    res.json({ jobs });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Add GET /jobs/:id endpoint**

Add to router:

```javascript
// GET /api/job-library/jobs/:id - Get job details
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await jobLibraryService.getJobById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Get candidates for this job
    const candidates = await jobLibraryService.getCandidatesByJobId(id);
    
    res.json({ job, candidates });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 3: Add DELETE /jobs/:id endpoint**

Add to router:

```javascript
// DELETE /api/job-library/jobs/:id - Delete job
router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await jobLibraryService.deleteJob(id);
    res.json({ success: true });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 4: Add POST /jobs/:id/candidates endpoint**

Add to router:

```javascript
// POST /api/job-library/jobs/:id/candidates - Add candidate
router.post('/jobs/:id/candidates', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    
    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, email' });
    }
    
    const candidateId = await jobLibraryService.addCandidate(id, { name, phone, email });
    res.json({ candidate_id: candidateId });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 5: Add POST /candidates/:candidateId/generate-link endpoint**

Add to router:

```javascript
// POST /api/job-library/candidates/:candidateId/generate-link - Generate interview link
router.post('/candidates/:candidateId/generate-link', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId' });
    }
    
    const link = await jobLibraryService.generateInterviewLink(jobId, candidateId);
    res.json({ interview_link: link });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 6: Add DELETE /candidates/:candidateId endpoint**

Add to router:

```javascript
// DELETE /api/job-library/candidates/:candidateId - Delete candidate
router.delete('/candidates/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    await jobLibraryService.deleteCandidate(candidateId);
    res.json({ success: true });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 7: Commit**

```bash
git add src/routes/jobLibraryRoutes.js
git commit -m "feat: create job library API routes"
```

---

### Task 4: Register Job Library Routes in Server

**Files:**
- Modify: `src/server.js`

- [ ] **Step 1: Open server.js and locate route registration**

Find where routes are imported/registered (around line 20-30)

- [ ] **Step 2: Add jobLibraryRoutes import and registration**

Add near top with other route imports:

```javascript
const jobLibraryRoutes = require('./routes/jobLibraryRoutes');
```

Add near route registration section (after other app.use):

```javascript
app.use('/api/job-library', jobLibraryRoutes);
```

- [ ] **Step 3: Verify server still starts**

Run: `npm start`

Expected: Server starts without errors

- [ ] **Step 4: Stop server and commit**

```bash
git add src/server.js
git commit -m "feat: register job library routes"
```

---

### Task 5: Modify setupRoutes - Save job to library instead of creating session

**Files:**
- Modify: `src/routes/setupRoutes.js`

- [ ] **Step 1: Open setupRoutes.js and view createSession endpoint**

Find the `/create-session` POST endpoint (around line 74)

- [ ] **Step 2: Add jobLibraryService import**

Add near top with other imports:

```javascript
const jobLibraryService = require('../services/jobLibraryService');
```

- [ ] **Step 3: Modify createSession endpoint**

Replace the entire POST /create-session handler:

```javascript
router.post('/create-session', async (req, res, next) => {
  try {
    const { hr_email, job_title, level, company, skills, questions_by_skill, jd_text } = req.body;

    if (!hr_email || !job_title || !level || !company || !skills) {
      return res.status(400).json({
        error: 'Missing required parameters: hr_email, job_title, level, company, skills'
      });
    }

    // Save job to job library
    const jobId = await jobLibraryService.createJob({
      hr_email,
      job_title,
      level,
      company,
      skills,
      questions_by_skill,
      jd_text
    });

    // Also create a session (for backward compatibility / interview flow)
    const result = await sessionManager.createSession({
      hr_email,
      job_title,
      level,
      company,
      skills,
      questions_by_skill
    });

    res.json({
      job_id: jobId,
      session_id: result.session_id,
      redirect: '/job-library'  // Signal frontend to go to library
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});
```

- [ ] **Step 4: Test endpoint returns job_id**

Run server, call /api/setup/create-session with test data, verify response includes `job_id` and `redirect`

- [ ] **Step 5: Commit**

```bash
git add src/routes/setupRoutes.js
git commit -m "feat: modify createSession to save job to library and redirect"
```

---

### Task 6: Create Job Library Frontend Page

**Files:**
- Create: `public/js/jobLibraryPage.js`

- [ ] **Step 1: Create jobLibraryPage.js skeleton**

Create `public/js/jobLibraryPage.js`:

```javascript
/**
 * Job Library Page - Display list of jobs saved by HR
 */

const JobLibraryPage = {
  currentJobId: null,

  /**
   * Initialize and render job library
   */
  init(hrEmail) {
    this.hrEmail = hrEmail;
    this.render(document.getElementById('app'));
  },

  /**
   * Render job library page
   */
  render(container) {
    const html = `
      <div class="page">
        <div class="job-library-container">
          <h1>Job Library</h1>
          <p>Your saved interview jobs</p>
          
          <div id="jobs-list" class="jobs-list">
            Loading...
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    this.loadJobs();
  },

  /**
   * Load jobs from API
   */
  async loadJobs() {
    try {
      const response = await fetch(`/api/job-library/jobs?hr_email=${encodeURIComponent(this.hrEmail)}`);
      const data = await response.json();
      
      this.renderJobsList(data.jobs || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      document.getElementById('jobs-list').innerHTML = `<p>Error loading jobs: ${error.message}</p>`;
    }
  },

  /**
   * Render jobs list
   */
  renderJobsList(jobs) {
    if (jobs.length === 0) {
      document.getElementById('jobs-list').innerHTML = '<p>No jobs yet. Create one in the setup flow.</p>';
      return;
    }

    const jobsHtml = jobs.map(job => `
      <div class="job-card">
        <div class="job-info">
          <h3>${job.job_title}</h3>
          <p><strong>Level:</strong> ${job.level}</p>
          <p><strong>Company:</strong> ${job.company}</p>
          <p><strong>Job ID:</strong> <code>${job.id}</code></p>
          <p><strong>Candidates:</strong> ${job.candidate_count || 0}</p>
          <p><strong>Created:</strong> ${new Date(job.created_at).toLocaleDateString()}</p>
        </div>
        
        <div class="job-actions">
          <button class="btn btn-primary" onclick="JobLibraryPage.viewJob('${job.id}')">View</button>
          <button class="btn btn-secondary" onclick="JobLibraryPage.editJob('${job.id}')">Edit</button>
          <button class="btn btn-danger" onclick="JobLibraryPage.deleteJob('${job.id}')">Delete</button>
        </div>
      </div>
    `).join('');

    document.getElementById('jobs-list').innerHTML = jobsHtml;
  },

  /**
   * View job details
   */
  viewJob(jobId) {
    App.goToPage('job-detail', { jobId });
  },

  /**
   * Edit job (TODO: implement later)
   */
  editJob(jobId) {
    alert('Edit job: ' + jobId);
  },

  /**
   * Delete job
   */
  async deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`/api/job-library/jobs/${jobId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete job');
      
      App.showSuccess('Job deleted');
      this.loadJobs();
    } catch (error) {
      App.showError(error.message);
    }
  }
};
```

- [ ] **Step 2: Add CSS for job library page**

Add to `public/css/style.css`:

```css
/* Job Library Page */
.job-library-container {
  max-width: 1000px;
  margin: 0 auto;
}

.jobs-list {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.job-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9f9f9;
  transition: box-shadow 0.2s;
}

.job-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.job-info h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.job-info p {
  margin: 6px 0;
  color: #666;
  font-size: 13px;
}

.job-info code {
  background: #eee;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.job-actions {
  display: flex;
  gap: 8px;
  flex-direction: column;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #da190b;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/js/jobLibraryPage.js public/css/style.css
git commit -m "feat: create job library page UI and styles"
```

---

### Task 7: Create Job Detail Page

**Files:**
- Create: `public/js/jobDetailPage.js`

- [ ] **Step 1: Create jobDetailPage.js**

Create `public/js/jobDetailPage.js`:

```javascript
/**
 * Job Detail Page - View job details and manage candidates
 */

const JobDetailPage = {
  jobId: null,
  job: null,
  candidates: [],
  showAddCandidateForm: false,

  /**
   * Initialize job detail page
   */
  init(jobId) {
    this.jobId = jobId;
    this.loadJobDetails();
  },

  /**
   * Load job and candidates from API
   */
  async loadJobDetails() {
    try {
      const response = await fetch(`/api/job-library/jobs/${this.jobId}`);
      const data = await response.json();
      
      this.job = data.job;
      this.candidates = data.candidates || [];
      this.render(document.getElementById('app'));
    } catch (error) {
      console.error('Error loading job:', error);
      document.getElementById('app').innerHTML = `<p>Error loading job: ${error.message}</p>`;
    }
  },

  /**
   * Render job detail page
   */
  render(container) {
    const jobDetailsHtml = `
      <div class="job-detail-header">
        <button class="btn btn-secondary" onclick="App.goToPage('job-library', {})">← Back to Library</button>
      </div>
      
      <div class="job-detail-info">
        <h2>${this.job.job_title}</h2>
        <p><strong>Level:</strong> ${this.job.level}</p>
        <p><strong>Company:</strong> ${this.job.company}</p>
        <p><strong>Job ID:</strong> <code>${this.job.id}</code></p>
        
        <h3>Job Description</h3>
        <p>${(this.job.jd_text || 'No description').substring(0, 200)}...</p>
        
        <h3>Skills</h3>
        <div class="skills-list">
          ${(this.job.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
        
        <h3>Interview Questions</h3>
        <div class="questions-list">
          ${Object.entries(this.job.questions_by_skill || {}).map(([skill, questions]) => `
            <div class="skill-section">
              <h4>${skill}</h4>
              <ul>
                ${(questions || []).map(q => `<li>${q}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="candidates-section">
        <div class="candidates-header">
          <h3>Candidates</h3>
          <button class="btn btn-primary" onclick="JobDetailPage.toggleAddCandidateForm()">+ Add Candidate</button>
        </div>
        
        ${this.showAddCandidateForm ? this.renderAddCandidateForm() : ''}
        
        <div id="candidates-list">
          ${this.renderCandidatesList()}
        </div>
      </div>
    `;

    container.innerHTML = `<div class="page">${jobDetailsHtml}</div>`;
    
    // Attach form listener if form exists
    const form = document.getElementById('add-candidate-form');
    if (form) {
      form.addEventListener('submit', (e) => this.submitAddCandidateForm(e));
    }
  },

  /**
   * Render add candidate form
   */
  renderAddCandidateForm() {
    return `
      <form id="add-candidate-form" class="add-candidate-form">
        <input type="text" id="candidate-name" placeholder="Full Name" required>
        <input type="tel" id="candidate-phone" placeholder="Phone Number" required>
        <input type="email" id="candidate-email" placeholder="Email Address" required>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Save Candidate</button>
          <button type="button" class="btn btn-secondary" onclick="JobDetailPage.toggleAddCandidateForm()">Cancel</button>
        </div>
      </form>
    `;
  },

  /**
   * Render candidates list
   */
  renderCandidatesList() {
    if (this.candidates.length === 0) {
      return '<p>No candidates yet.</p>';
    }

    return `
      <div class="candidates-table">
        ${this.candidates.map(c => `
          <div class="candidate-row">
            <div class="candidate-info">
              <p><strong>${c.name}</strong></p>
              <p>${c.phone} | ${c.email}</p>
              <p><strong>Status:</strong> ${c.link_sent ? (c.interview_status === 'completed' ? '✓ Completed' : '→ In Progress') : 'Not sent'}</p>
            </div>
            
            <div class="candidate-actions">
              ${!c.link_sent ? `
                <button class="btn btn-primary btn-sm" onclick="JobDetailPage.generateInterviewLink('${c.id}')">
                  Generate Link
                </button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="JobDetailPage.copyInterviewLink('${c.interview_link}')">
                  Copy Link
                </button>
              `}
              <button class="btn btn-danger btn-sm" onclick="JobDetailPage.deleteCandidate('${c.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Toggle add candidate form
   */
  toggleAddCandidateForm() {
    this.showAddCandidateForm = !this.showAddCandidateForm;
    this.render(document.getElementById('app'));
  },

  /**
   * Handle add candidate form submit
   */
  async submitAddCandidateForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('candidate-name').value.trim();
    const phone = document.getElementById('candidate-phone').value.trim();
    const email = document.getElementById('candidate-email').value.trim();

    try {
      const response = await fetch(`/api/job-library/jobs/${this.jobId}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email })
      });

      if (!response.ok) throw new Error('Failed to add candidate');
      
      App.showSuccess('Candidate added');
      this.showAddCandidateForm = false;
      this.loadJobDetails();
    } catch (error) {
      App.showError(error.message);
    }
  },

  /**
   * Generate interview link for candidate
   */
  async generateInterviewLink(candidateId) {
    try {
      const response = await fetch(`/api/job-library/candidates/${candidateId}/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: this.jobId })
      });

      if (!response.ok) throw new Error('Failed to generate link');

      const data = await response.json();
      App.showSuccess('Link generated! Copied to clipboard.');
      
      // Copy to clipboard
      navigator.clipboard.writeText(window.location.origin + data.interview_link);
      
      this.loadJobDetails();
    } catch (error) {
      App.showError(error.message);
    }
  },

  /**
   * Copy interview link to clipboard
   */
  copyInterviewLink(link) {
    navigator.clipboard.writeText(window.location.origin + link);
    App.showSuccess('Link copied to clipboard!');
  },

  /**
   * Delete candidate
   */
  async deleteCandidate(candidateId) {
    if (!confirm('Delete this candidate?')) return;

    try {
      const response = await fetch(`/api/job-library/candidates/${candidateId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete candidate');
      
      App.showSuccess('Candidate deleted');
      this.loadJobDetails();
    } catch (error) {
      App.showError(error.message);
    }
  }
};
```

- [ ] **Step 2: Add styles for job detail page**

Add to `public/css/style.css`:

```css
/* Job Detail Page */
.job-detail-header {
  margin-bottom: 20px;
}

.job-detail-info {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.job-detail-info h2 {
  margin-top: 0;
  color: #333;
}

.job-detail-info h3 {
  margin-top: 16px;
  color: #555;
  font-size: 16px;
}

.job-detail-info code {
  background: #ddd;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.skill-tag {
  background: #667eea;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.questions-list {
  margin: 12px 0;
}

.skill-section h4 {
  margin: 12px 0 8px 0;
  color: #555;
}

.skill-section ul {
  margin: 0;
  padding-left: 20px;
}

.skill-section li {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

/* Candidates Section */
.candidates-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.candidates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.candidates-header h3 {
  margin: 0;
}

/* Add Candidate Form */
.add-candidate-form {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-candidate-form input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 8px;
}

/* Candidates Table */
.candidates-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.candidate-row {
  border: 1px solid #eee;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.candidate-info p {
  margin: 4px 0;
  font-size: 14px;
}

.candidate-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}
```

- [ ] **Step 3: Commit**

```bash
git add public/js/jobDetailPage.js public/css/style.css
git commit -m "feat: create job detail page with candidate management"
```

---

### Task 8: Modify app.js to register new pages

**Files:**
- Modify: `public/js/app.js`

- [ ] **Step 1: Open app.js and find goToPage switch**

Find the `goToPage` method (around line 21)

- [ ] **Step 2: Add routes for job-library and job-detail**

Modify the switch statement:

```javascript
goToPage(pageName, data = {}) {
  this.currentPage = pageName;
  this.appElement.innerHTML = '';

  switch (pageName) {
    case 'setup':
      SetupPage.render(this.appElement, data);
      break;
    case 'interview':
      if (data.sessionId) {
        InterviewPage.init(data.sessionId);
      } else {
        InterviewPage.render(this.appElement, data);
      }
      break;
    case 'review':
      if (data.sessionId) {
        ReviewPage.init(data.sessionId);
      } else {
        ReviewPage.render(this.appElement, data);
      }
      break;
    case 'job-library':
      JobLibraryPage.init(data.hrEmail || 'user@example.com');
      break;
    case 'job-detail':
      JobDetailPage.init(data.jobId);
      break;
    default:
      console.error(`Unknown page: ${pageName}`);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add public/js/app.js
git commit -m "feat: add job-library and job-detail page routes"
```

---

### Task 9: Modify setupPage to redirect to job library and register new scripts

**Files:**
- Modify: `public/js/setupPage.js`
- Modify: `public/index.html`

- [ ] **Step 1: Modify setupPage.js - createSession method**

Find createSession method (around line 591). After successful session creation, change redirect:

Replace:
```javascript
App.goToPage('interview', { sessionId: session_id });
```

With:
```javascript
// Redirect to job library instead of interview
App.goToPage('job-library', { hrEmail: this.formData.hr_email });
```

- [ ] **Step 2: Add script includes to index.html**

Open `public/index.html` and add script includes for new pages:

Before closing `</body>` tag, add:

```html
  <script src="/js/jobLibraryPage.js"></script>
  <script src="/js/jobDetailPage.js"></script>
```

- [ ] **Step 3: Commit**

```bash
git add public/js/setupPage.js public/index.html
git commit -m "feat: redirect from setup to job library, add script includes"
```

---

### Task 10: Test integration end-to-end

**Files:**
- Test in browser

- [ ] **Step 1: Start server**

Run: `npm start`

Expected: Server starts without errors

- [ ] **Step 2: Navigate to setup flow**

Open browser to `http://localhost:3000`

Expected: Step 1 form appears

- [ ] **Step 3: Complete setup flow through Step 5**

Fill all steps and create session

Expected: Redirects to Job Library page

- [ ] **Step 4: Verify job appears in library**

Check job list shows job with title, level, company, JobID

Expected: Job card displayed

- [ ] **Step 5: Click View button**

Click View on the job

Expected: Job Detail page opens with JD, skills, questions

- [ ] **Step 6: Add candidate**

Click "+ Add Candidate", fill form, save

Expected: Candidate appears in list with "Not sent" status

- [ ] **Step 7: Generate interview link**

Click "Generate Link" for candidate

Expected: Link copied to clipboard, status changes

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: verify job library end-to-end flow works"
```

---

## Bugs Found and Fixed During Integration Testing (14/09)

During end-to-end testing of the Job Library feature, 5 critical bugs were discovered and fixed in a single comprehensive commit:

### Bug #1: Database Initialization Disabled
**Issue:** Server initializes database with `.initialize()` but the call was disabled in `src/server.js`, preventing any data persistence.

**Root Cause:** Database initialization code commented out during earlier development.

**Fix Applied:** Re-enabled database initialization in server.js with graceful fallback for errors.

**Files Modified:** `src/server.js`

---

### Bug #2: Column Name Mismatch
**Issue:** Schema defines `job_id` column in candidates table, but `sessionManager.js` queries reference `id` instead, causing SELECT/UPDATE queries to fail.

**Root Cause:** Schema migration not synchronized with service layer code.

**Fix Applied:** Updated `sessionManager.js` to use correct column references (`job_id` for foreign key).

**Files Modified:** `src/services/sessionManager.js`

---

### Bug #3: Missing HTML Redirect Target Pages
**Issue:** After completing setup, redirect to `/job-library` endpoint fails with 404 because `/public/job-library.html` doesn't exist.

**Root Cause:** Frontend pages were in the implementation plan but not created during Task 6.

**Fix Applied:** Created `public/job-library.html` and `public/job-detail.html` as redirect target pages.

**Files Created:** 
- `public/job-library.html`
- `public/job-detail.html`

---

### Bug #4: Interview Link Not Displayed in Candidate Management UI
**Issue:** The copy link and send email features in the candidate management UI were missing, making it impossible for users to share interview links with candidates.

**Root Cause:** UI implementation incomplete - missing button handlers and display logic.

**Fix Applied:** 
- Added "Copy Link" and "Send Email" buttons to `public/library.html`
- Implemented copy-to-clipboard functionality
- Added link status display showing whether link was sent

**Files Modified:** `public/library.html`, `public/job-detail.html`

---

### Bug #5: Job Detail Page Candidate Management Incomplete
**Issue:** The Job Detail page UI for adding/managing candidates had incomplete form handling and action buttons.

**Root Cause:** Implementation incomplete during Task 7.

**Fix Applied:**
- Enhanced `jobDetailPage.js` with proper form submission handling
- Added candidate action buttons (Generate Link, Copy Link, Delete)
- Implemented interview link generation and copying
- Added email sending UI elements

**Files Modified:** 
- `public/js/jobDetailPage.js`
- `public/js/setupPage.js`

---

### Testing Result
✅ All bugs fixed and verified working end-to-end:
- Database persists job and candidate data
- Job library displays saved jobs correctly
- Job detail page shows full job info and candidate list
- Interview links can be generated and copied
- Candidates can be added, viewed, and deleted

---

## Summary

**Total Tasks:** 10  
**Database:** Jobs + Candidates tables  
**Backend:** Job Library service + API routes  
**Frontend:** Job Library page + Job Detail page  
**Flow:** Setup → Job Library (instead of Interview)

**Bugs Fixed:** 5 critical issues resolved during integration testing
