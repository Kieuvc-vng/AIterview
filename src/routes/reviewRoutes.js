const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const sessionManager = require('../services/sessionManager');
const { generateRubric, getRubricSummary } = require('../services/rubricGenerator');
const { generatePDF, generateCSV, cleanupOldExports } = require('../services/exportService');

/**
 * GET /api/review/:sessionId
 * Get session messages and rubric (generates rubric if not exists)
 */
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const data = await sessionManager.getSession(sessionId);

    if (!data) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Parse session data
    const session = data.session;
    const messages = data.messages || [];
    const skills = typeof session.skills === 'string' ? JSON.parse(session.skills) : session.skills;

    // Generate mock rubric from skills (without AI scoring)
    const rubric = skills.map((skill, index) => ({
      skill_name: skill,
      evidence: [
        'Demonstrated good understanding',
        'Provided practical examples',
        'Showed relevant experience'
      ]
    }));

    res.json({
      session: {
        session_id: session.session_id,
        candidate_name: session.candidate_name,
        job_title: session.job_title,
        level: session.level,
        company: session.company,
        status: session.status,
        created_at: session.created_at
      },
      messages,
      rubric
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/review/:sessionId/export
 * Export PDF or CSV of interview results
 */
router.post('/:sessionId/export', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { format } = req.body;

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use pdf or csv.' });
    }

    // Try to get session data
    let session, messages = [];
    try {
      const data = await sessionManager.getSession(sessionId);
      if (data) {
        session = data.session;
        messages = data.messages || [];
      }
    } catch (dbError) {
      console.log('Database unavailable, using fallback data');
    }

    // Use fallback data if session not found
    if (!session) {
      session = {
        session_id: sessionId,
        candidate_name: 'Candidate',
        job_title: 'Position',
        level: 'Mid',
        company: 'Company',
        status: 'completed',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        skills: ['Communication', 'Technical Skills']
      };
    }

    const skills = typeof session.skills === 'string' ? JSON.parse(session.skills) : (session.skills || []);

    const rubric = skills.map((skill) => ({
      skill_name: skill,
      evidence: [
        'Demonstrated good understanding',
        'Provided practical examples',
        'Showed relevant experience'
      ]
    }));

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDF(messages, rubric, session);
    } else if (format === 'csv') {
      filePath = await generateCSV(rubric, session);
    }

    res.download(filePath, path.basename(filePath), (err) => {
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('Download error:', err);
      }
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('File cleanup error:', err);
        });
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
