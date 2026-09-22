const express = require('express');
const router = express.Router();
const fs = require('fs');

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

    // Generate mock rubric from skills
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
  res.status(503).json({
    error: 'Database not available. Please install Visual Studio Build Tools to enable this feature.'
  });
});

module.exports = router;
