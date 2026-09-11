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

    res.json({
      session: data.session,
      messages: data.messages,
      rubric: [] // TODO: generate rubric when needed
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
