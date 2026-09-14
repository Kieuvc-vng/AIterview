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

  // Save job to library
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
  },

  // Get candidates for a job
  async getCandidatesByJobId(jobId) {
    const candidates = await db.query(
      'SELECT id, name, phone, email, link_sent, interview_status FROM candidates WHERE job_id = ? ORDER BY created_at',
      [jobId]
    );
    return candidates || [];
  },

  // Add candidate to a job
  async addCandidate(jobId, candidateData) {
    const candidateId = 'cand_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    await db.query(
      'INSERT INTO candidates (id, job_id, name, phone, email) VALUES (?, ?, ?, ?, ?)',
      [candidateId, jobId, candidateData.name, candidateData.phone, candidateData.email]
    );

    return candidateId;
  },

  // Generate interview link for candidate
  async generateInterviewLink(jobId, candidateId) {
    const interviewLink = `/interview?job=${jobId}&candidate=${candidateId}`;

    await db.query(
      'UPDATE candidates SET link_sent = 1, interview_link = ? WHERE id = ?',
      [interviewLink, candidateId]
    );

    return interviewLink;
  },

  // Delete candidate
  async deleteCandidate(candidateId) {
    await db.query('DELETE FROM candidates WHERE id = ?', [candidateId]);
    return true;
  }
};

module.exports = jobLibraryService;
