const express = require('express');
const router = express.Router();
const fs = require('fs');

const { getSessionData, getSessionMessages, getSessionRubric } = require('../services/sessionManager');
const { generateRubric, getRubricSummary } = require('../services/rubricGenerator');
const { generatePDF, generateCSV, cleanupOldExports } = require('../services/exportService');

// Global cache for rubrics (for now - will move to DB later)
const rubricCache = {};

/**
 * GET /api/review/:sessionId
 * Get session messages and rubric (generates rubric if not exists)
 */
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Get session data and messages
    const sessionData = getSessionData(sessionId);
    const messages = getSessionMessages(sessionId);

    // Get rubric from DB, or generate if not exists
    let rubric = getSessionRubric(sessionId);

    if (!rubric || rubric.length === 0) {
      // Generate rubric from messages
      rubric = await generateRubric(messages, sessionData.skills);

      // Cache it
      rubricCache[sessionId] = rubric;
    } else {
      // Rubric already exists in DB, cache it
      rubricCache[sessionId] = rubric;
    }

    // Get summary
    const rubricSummary = getRubricSummary(rubric);

    res.json({
      session: sessionData,
      messages: messages,
      rubric: rubric,
      rubric_summary: rubricSummary
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Session not found' });
    }
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
      return res.status(400).json({
        error: 'Invalid format. Must be "pdf" or "csv"'
      });
    }

    // Get session data, messages, and rubric
    const sessionData = getSessionData(sessionId);
    const messages = getSessionMessages(sessionId);
    let rubric = rubricCache[sessionId] || getSessionRubric(sessionId);

    if (!rubric || rubric.length === 0) {
      // Generate rubric if not cached
      rubric = await generateRubric(messages, sessionData.skills);
      rubricCache[sessionId] = rubric;
    }

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDF(messages, rubric, sessionData);
    } else if (format === 'csv') {
      filePath = await generateCSV(rubric, sessionData);
    }

    // Read file and send
    const fileContent = fs.readFileSync(filePath);
    const fileName = filePath.split('\\').pop();

    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileContent);

    // Cleanup old exports (async, don't wait)
    cleanupOldExports().catch(err => console.error('Cleanup error:', err));
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Session not found' });
    }
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
