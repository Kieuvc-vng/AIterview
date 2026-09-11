const express = require('express');
const router = express.Router();

const sessionManager = require('../services/sessionManager');
const { conductInterview, generateOpeningGreeting } = require('../services/aiIntegration');
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality, isInterviewComplete, moveToNextSkillIfNeeded } = require('../services/interviewEngine');

/**
 * GET /api/interview/:sessionId
 * Get session data with messages
 */
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const data = await sessionManager.getSession(sessionId);

    if (!data) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(data);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/interview/:sessionId/start
 * Start interview - initialize state, save candidate name
 */
router.post('/:sessionId/start', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { candidate_name } = req.body;

    if (!candidate_name) {
      return res.status(400).json({ error: 'Missing required parameter: candidate_name' });
    }

    const sessionData = await sessionManager.getSession(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await sessionManager.startInterview(sessionId, candidate_name);

    const opening_message = await generateOpeningGreeting(
      sessionData.session.job_title,
      sessionData.session.level,
      candidate_name
    );

    await sessionManager.saveMessage(sessionId, {
      sender: 'ai',
      content: opening_message,
      skill_name: null,
      question_index: null,
      attempt_number: null
    });

    const updatedData = await sessionManager.getSession(sessionId);

    res.json({
      session: updatedData.session,
      opening_message,
      current_question: {
        skill: 'TBD',
        question: 'Interview started'
      }
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/interview/:sessionId/message
 * Main interview loop - receive candidate answer, AI evaluates, determines next action
 */
router.post('/:sessionId/message', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { candidate_message } = req.body;

    if (!candidate_message) {
      return res.status(400).json({ error: 'Missing required parameter: candidate_message' });
    }

    const sessionData = await sessionManager.getSession(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Save candidate message
    await sessionManager.saveMessage(sessionId, {
      sender: 'candidate',
      content: candidate_message,
      skill_name: null,
      question_index: null,
      attempt_number: null
    });

    // Get AI response (mock for now)
    const ai_response = `Thank you for that answer. Let me follow up on what you said...`;

    // Save AI response
    await sessionManager.saveMessage(sessionId, {
      sender: 'ai',
      content: ai_response,
      skill_name: null,
      question_index: null,
      attempt_number: null
    });

    res.json({
      ai_response,
      answer_good: true,
      next_action: 'next_question',
      next_question: null,
      interview_complete: false
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
