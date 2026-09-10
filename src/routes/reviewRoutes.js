const express = require('express');
const router = express.Router();
const fs = require('fs');

// const { getSessionData, getSessionMessages, getSessionRubric } = require('../services/sessionManager');  // Temporarily disabled
const { generateRubric, getRubricSummary } = require('../services/rubricGenerator');
const { generatePDF, generateCSV, cleanupOldExports } = require('../services/exportService');

// Global cache for rubrics (for now - will move to DB later)
const rubricCache = {};

/**
 * GET /api/review/:sessionId
 * Get session messages and rubric (generates rubric if not exists)
 */
router.get('/:sessionId', async (req, res, next) => {
  res.status(503).json({
    error: 'Database not available. Please install Visual Studio Build Tools to enable this feature.'
  });
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
