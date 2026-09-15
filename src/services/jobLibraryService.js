let dbModule = null;

// Try to load database module
try {
  dbModule = require('../db/init');
} catch (error) {
  console.log('[jobLibraryService] Database module not available');
}

// In-memory store for when database is unavailable
const inMemoryStore = {
  jobs: {},
  candidates: {}
};

const jobLibraryService = {
  // Get all jobs for HR
  async getJobs(hrEmail) {
    try {
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }

      if (db) {
        const jobs = await db.prepare(
          'SELECT id, job_title, level, company, created_at, (SELECT COUNT(*) FROM candidates WHERE job_id = jobs.id) as candidate_count FROM jobs WHERE hr_email = ? ORDER BY created_at DESC'
        ).all(hrEmail);
        return jobs || [];
      } else {
        // In-memory fallback
        const jobs = Object.values(inMemoryStore.jobs)
          .filter(job => job.hr_email === hrEmail)
          .map(job => ({
            id: job.id,
            job_title: job.job_title,
            level: job.level,
            company: job.company,
            created_at: job.created_at,
            candidate_count: Object.values(inMemoryStore.candidates).filter(c => c.job_id === job.id).length
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return jobs;
      }
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  },

  // Get job by ID with full details
  async getJobById(jobId) {
    try {
      let jobData;
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }

      if (db) {
        const jobs = await db.prepare(
          'SELECT * FROM jobs WHERE id = ?'
        ).all(jobId);

        if (!jobs || jobs.length === 0) return null;
        jobData = jobs[0];
      } else {
        // In-memory fallback
        jobData = inMemoryStore.jobs[jobId];
        if (!jobData) return null;
      }

      try {
        if (typeof jobData.skills === 'string') {
          jobData.skills = JSON.parse(jobData.skills || '[]');
        }
        if (typeof jobData.questions_by_skill === 'string') {
          jobData.questions_by_skill = JSON.parse(jobData.questions_by_skill || '{}');
        }
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

      const jobRecord = {
        id: jobId,
        hr_email: jobData.hr_email,
        job_title: jobData.job_title,
        level: jobData.level,
        company: jobData.company,
        skills: JSON.stringify(jobData.skills),
        questions_by_skill: JSON.stringify(jobData.questions_by_skill),
        jd_text: jobData.jd_text,
        created_at: new Date().toISOString()
      };

      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }

      if (db) {
        await db.prepare(
          'INSERT INTO jobs (id, hr_email, job_title, level, company, skills, questions_by_skill, jd_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(
          jobId,
          jobData.hr_email,
          jobData.job_title,
          jobData.level,
          jobData.company,
          JSON.stringify(jobData.skills),
          JSON.stringify(jobData.questions_by_skill),
          jobData.jd_text
        );
      } else {
        inMemoryStore.jobs[jobId] = jobRecord;
      }

      return jobId;
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  },

  // Update job
  async updateJob(jobId, jobData) {
    try {
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }

      if (!db) throw new Error('Database not available');

      const result = await db.prepare(
        'UPDATE jobs SET job_title = ?, level = ?, company = ?, skills = ?, questions_by_skill = ?, jd_text = ? WHERE id = ?'
      ).run(
        jobData.job_title,
        jobData.level,
        jobData.company,
        JSON.stringify(jobData.skills),
        JSON.stringify(jobData.questions_by_skill),
        jobData.jd_text,
        jobId
      );

      if (!result || result.changes === 0) {
        throw new Error(`Job ${jobId} not found`);
      }

      return jobId;
    } catch (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }
  },

  // Delete job
  async deleteJob(jobId) {
    try {
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }
      if (!db) throw new Error('Database not available');
      const result = await db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
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
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }
      if (db) {
        const candidates = await db.prepare(
          'SELECT id, name, phone, email, interview_link, link_sent, interview_status FROM candidates WHERE job_id = ? ORDER BY created_at'
        ).all(jobId);
        return candidates || [];
      } else {
        // In-memory fallback
        const candidates = Object.values(inMemoryStore.candidates)
          .filter(c => c.job_id === jobId)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return candidates || [];
      }
    } catch (error) {
      throw new Error(`Failed to fetch candidates: ${error.message}`);
    }
  },

  // Add candidate
  async addCandidate(jobId, candidateData) {
    try {
      const candidateId = 'cand_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);

      const candidateRecord = {
        id: candidateId,
        job_id: jobId,
        name: candidateData.name,
        phone: candidateData.phone,
        email: candidateData.email,
        link_sent: 0,
        interview_status: 'not_started',
        created_at: new Date().toISOString()
      };

      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }

      if (db) {
        await db.prepare(
          'INSERT INTO candidates (id, job_id, name, phone, email) VALUES (?, ?, ?, ?, ?)'
        ).run(candidateId, jobId, candidateData.name, candidateData.phone, candidateData.email);
      } else {
        // In-memory fallback
        inMemoryStore.candidates[candidateId] = candidateRecord;
      }

      return candidateId;
    } catch (error) {
      throw new Error(`Failed to add candidate: ${error.message}`);
    }
  },

  // Generate interview link
  async generateInterviewLink(jobId, candidateId) {
    try {
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }
      if (!db) throw new Error('Database not available');
      const interviewLink = `/interview?job=${jobId}&candidate=${candidateId}`;

      const result = await db.prepare(
        'UPDATE candidates SET link_sent = 1, interview_link = ? WHERE id = ?'
      ).run(interviewLink, candidateId);

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
      let db = null;
      if (dbModule && dbModule.getDb) {
        db = await dbModule.getDb();
      }
      if (!db) throw new Error('Database not available');
      const result = await db.prepare('DELETE FROM candidates WHERE id = ?').run(candidateId);
      if (!result || result.changes === 0) {
        throw new Error(`Candidate ${candidateId} not found`);
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to delete candidate: ${error.message}`);
    }
  },

  // Get candidate by ID
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

  // Get candidate interview results (interview, summaries, messages)
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
  }
};

module.exports = jobLibraryService;
