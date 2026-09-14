const db = require('./sessionManager');

const jobLibraryService = {
  // Get all jobs for HR
  async getJobs(hrEmail) {
    try {
      const jobs = await db.query(
        'SELECT id, job_title, level, company, created_at, (SELECT COUNT(*) FROM candidates WHERE job_id = jobs.id) as candidate_count FROM jobs WHERE hr_email = ? ORDER BY created_at DESC',
        [hrEmail]
      );
      return jobs || [];
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  },

  // Get job by ID with full details
  async getJobById(jobId) {
    try {
      const job = await db.query(
        'SELECT * FROM jobs WHERE id = ?',
        [jobId]
      );
      if (!job || job.length === 0) return null;

      const jobData = job[0];
      try {
        jobData.skills = JSON.parse(jobData.skills || '[]');
        jobData.questions_by_skill = JSON.parse(jobData.questions_by_skill || '{}');
      } catch (parseError) {
        console.error(`Failed to parse JSON for job ${jobId}:`, parseError);
        jobData.skills = [];
        jobData.questions_by_skill = {};
      }

      return jobData;
    } catch (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }
  },

  // Save job to library
  async createJob(jobData) {
    try {
      const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);

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
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      const result = await db.query('DELETE FROM jobs WHERE id = ?', [jobId]);
      if (!result || result.changes === 0) {
        throw new Error(`Job ${jobId} not found`);
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  },

  // Get candidates for a job
  async getCandidatesByJobId(jobId) {
    try {
      const candidates = await db.query(
        'SELECT id, name, phone, email, link_sent, interview_status FROM candidates WHERE job_id = ? ORDER BY created_at',
        [jobId]
      );
      return candidates || [];
    } catch (error) {
      throw new Error(`Failed to fetch candidates: ${error.message}`);
    }
  },

  // Add candidate
  async addCandidate(jobId, candidateData) {
    try {
      const candidateId = 'cand_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);

      await db.query(
        'INSERT INTO candidates (id, job_id, name, phone, email) VALUES (?, ?, ?, ?, ?)',
        [candidateId, jobId, candidateData.name, candidateData.phone, candidateData.email]
      );

      return candidateId;
    } catch (error) {
      throw new Error(`Failed to add candidate: ${error.message}`);
    }
  },

  // Generate interview link
  async generateInterviewLink(jobId, candidateId) {
    try {
      const interviewLink = `/interview?job=${jobId}&candidate=${candidateId}`;

      const result = await db.query(
        'UPDATE candidates SET link_sent = 1, interview_link = ? WHERE id = ?',
        [interviewLink, candidateId]
      );

      if (!result || result.changes === 0) {
        throw new Error(`Candidate ${candidateId} not found`);
      }

      return interviewLink;
    } catch (error) {
      throw new Error(`Failed to generate link: ${error.message}`);
    }
  },

  // Delete candidate
  async deleteCandidate(candidateId) {
    try {
      const result = await db.query('DELETE FROM candidates WHERE id = ?', [candidateId]);
      if (!result || result.changes === 0) {
        throw new Error(`Candidate ${candidateId} not found`);
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to delete candidate: ${error.message}`);
    }
  }
};

module.exports = jobLibraryService;
