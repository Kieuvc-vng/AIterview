const express = require('express');
const router = express.Router();

const jobLibraryService = require('../services/jobLibraryService');
const { generatePDF, generateCSV, cleanupOldExports } = require('../services/exportService');

let dbModule = null;
try {
  dbModule = require('../db/init');
} catch (error) {
  console.log('[reviewRoutes] Database module not available');
}

// In-memory store
const inMemoryStore = {
  interviews: {},
  messages: {},
  candidates: {}
};

/**
 * GET /api/review/:interviewId
 * Get interview data with messages and rubric
 */
router.get('/:interviewId', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    let db = null;
    if (dbModule && dbModule.getDb) {
      db = await dbModule.getDb();
    }

    let interview, candidate, job, messages;

    if (db) {
      // Get interview
      const interviews = await db.prepare('SELECT * FROM interviews WHERE id = ?').all(interviewId);
      if (!interviews || interviews.length === 0) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      interview = interviews[0];

      // Get candidate
      const candidates = await db.prepare('SELECT * FROM candidates WHERE id = ?').all(interview.candidate_id);
      candidate = candidates[0];

      // Get job
      const jobs = await db.prepare('SELECT * FROM jobs WHERE id = ?').all(interview.job_id);
      job = jobs[0];

      // Get messages
      const msgs = await db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC').all(interviewId);
      messages = msgs || [];
    } else {
      // In-memory fallback
      interview = inMemoryStore.interviews[interviewId];
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      candidate = inMemoryStore.candidates[interview.candidate_id];
      job = inMemoryStore.interviews[interview.job_id];
      messages = inMemoryStore.messages[interviewId] || [];
    }

    // Generate rubric from messages (mock scoring)
    const skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
    const rubric = skills.map((skill, index) => ({
      skill_name: skill,
      score: Math.floor(Math.random() * 3) + 7, // Mock score 7-10
      evidence: [
        'Demonstrated good understanding',
        'Provided practical examples',
        'Showed relevant experience'
      ]
    }));

    res.json({
      interview: {
        id: interview.id,
        job_id: interview.job_id,
        candidate_id: interview.candidate_id,
        candidate_name: candidate?.name || 'Unknown',
        job_title: job?.job_title,
        level: job?.level,
        company: job?.company,
        status: interview.status,
        created_at: interview.created_at
      },
      messages,
      rubric,
      rubric_summary: {
        total_score: rubric.reduce((sum, r) => sum + r.score, 0) / rubric.length || 0,
        skills_count: rubric.length
      }
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/review/:interviewId/export
 * Export interview results as PDF or CSV
 */
router.post('/:interviewId/export', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const { format } = req.body;

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use pdf or csv' });
    }

    let db = null;
    if (dbModule && dbModule.getDb) {
      db = await dbModule.getDb();
    }

    let interview, candidate, messages;

    if (db) {
      const interviews = await db.prepare('SELECT * FROM interviews WHERE id = ?').all(interviewId);
      if (!interviews || interviews.length === 0) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      interview = interviews[0];

      const candidates = await db.prepare('SELECT * FROM candidates WHERE id = ?').all(interview.candidate_id);
      candidate = candidates[0];

      const msgs = await db.prepare('SELECT * FROM messages WHERE interview_id = ?').all(interviewId);
      messages = msgs || [];
    } else {
      // In-memory fallback
      interview = inMemoryStore.interviews[interviewId];
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      candidate = inMemoryStore.candidates[interview.candidate_id];
      messages = inMemoryStore.messages[interviewId] || [];
    }

    // Generate export
    let data;
    let filename;
    let mimeType;

    if (format === 'pdf') {
      data = await generatePDF(interview, candidate, messages);
      filename = `interview-${interviewId}.pdf`;
      mimeType = 'application/pdf';
    } else {
      data = await generateCSV(interview, candidate, messages);
      filename = `interview-${interviewId}.csv`;
      mimeType = 'text/csv';
    }

    // Send file
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', mimeType);
    res.send(data);

    // Cleanup old exports
    cleanupOldExports();
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
