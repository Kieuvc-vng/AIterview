const express = require('express');
const router = express.Router();

// const { getSessionData, startInterview, endInterview, saveMessage, getSessionMessages } = require('../services/sessionManager');  // Temporarily disabled
const { conductInterview, generateOpeningGreeting } = require('../services/aiIntegration');
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality, isInterviewComplete, moveToNextSkillIfNeeded } = require('../services/interviewEngine');

// Global cache for interview states (for now - will move to DB later)
const interviewStates = {};

/**
 * GET /api/interview/:sessionId
 * Get session data with messages
 */
router.get('/:sessionId', (req, res, next) => {
  res.status(503).json({
    error: 'Database not available. Please install Visual Studio Build Tools to enable this feature.'
  });
});

/**
 * POST /api/interview/:sessionId/start
 * Start interview - initialize state, save candidate name
 */
router.post('/:sessionId/start', async (req, res, next) => {
  res.status(503).json({
    error: 'Database not available. Please install Visual Studio Build Tools to enable this feature.'
  });
});

/**
 * POST /api/interview/:sessionId/message
 * Main interview loop - receive candidate answer, AI evaluates, determines next action
 */
router.post('/:sessionId/message', async (req, res, next) => {
  res.status(503).json({
    error: 'Database not available. Please install Visual Studio Build Tools to enable this feature.'
  });
});

module.exports = router;
