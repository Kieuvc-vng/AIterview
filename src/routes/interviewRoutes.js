const express = require('express');
const router = express.Router();

const { getSessionData, startInterview, endInterview, saveMessage, getSessionMessages } = require('../services/sessionManager');
const { conductInterview, generateOpeningGreeting } = require('../services/aiIntegration');
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality, isInterviewComplete, moveToNextSkillIfNeeded } = require('../services/interviewEngine');

// Global cache for interview states (for now - will move to DB later)
const interviewStates = {};

/**
 * GET /api/interview/:sessionId
 * Get session data with messages
 */
router.get('/:sessionId', (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const sessionData = getSessionData(sessionId);
    const messages = getSessionMessages(sessionId);

    res.json({
      session: sessionData,
      messages: messages
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Session not found' });
    }
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

    // Get session data
    const sessionData = getSessionData(sessionId);

    // Start interview in DB (saves candidate name, sets status)
    const updatedSession = startInterview(sessionId, candidate_name);

    // Initialize interview state
    const interviewState = initializeInterviewState(sessionData);
    interviewStates[sessionId] = interviewState;

    // Get first question
    const firstQuestionData = getCurrentQuestion(interviewState, sessionData);

    // Generate opening greeting
    const openingMessage = await generateOpeningGreeting(candidate_name, sessionData.job_title, firstQuestionData.question_text);

    // Save opening message to DB
    saveMessage(sessionId, 'ai', openingMessage, firstQuestionData.skill_name, firstQuestionData.question_index, 1);

    res.json({
      session: updatedSession,
      current_question: firstQuestionData,
      opening_message: openingMessage
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Session not found' });
    }
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

    // Get session data
    const sessionData = getSessionData(sessionId);
    const messages = getSessionMessages(sessionId);

    // Get current interview state
    let interviewState = interviewStates[sessionId];
    if (!interviewState) {
      return res.status(400).json({ error: 'Interview not started. Call /start first.' });
    }

    // Save candidate message to DB
    const currentQuestion = getCurrentQuestion(interviewState, sessionData);
    saveMessage(sessionId, 'candidate', candidate_message, currentQuestion.skill_name, currentQuestion.question_index, currentQuestion.attempt_number);

    // Prepare messages for AI (convert to format expected by conductInterview)
    const previousMessages = messages.map(m => ({
      role: m.sender === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));
    previousMessages.push({
      role: 'user',
      content: candidate_message
    });

    // AI evaluates the answer
    const aiEvaluation = await conductInterview(
      currentQuestion.question_text,
      previousMessages,
      sessionData.candidate_name,
      sessionData.job_title,
      sessionData.level,
      currentQuestion.skill_name,
      currentQuestion.attempt_number
    );

    // Save AI response to DB
    saveMessage(sessionId, 'ai', aiEvaluation.ai_response, currentQuestion.skill_name, currentQuestion.question_index, currentQuestion.attempt_number);

    // Process answer quality to determine next action
    const answerProcessing = processAnswerQuality(interviewState, aiEvaluation.ai_response);
    interviewState = answerProcessing.updated_state;
    interviewStates[sessionId] = interviewState;

    // Check if we need to move to next skill
    interviewState = moveToNextSkillIfNeeded(interviewState, sessionData);
    interviewStates[sessionId] = interviewState;

    // Determine next action and response
    let nextAction = answerProcessing.next_action;
    let nextQuestion = null;
    let interviewComplete = false;

    if (isInterviewComplete(interviewState, sessionData)) {
      nextAction = 'end_interview';
      interviewComplete = true;
      endInterview(sessionId);
    } else if (nextAction === 'next_question') {
      nextQuestion = getCurrentQuestion(interviewState, sessionData);
    }

    res.json({
      ai_response: aiEvaluation.ai_response,
      answer_good: aiEvaluation.answer_good,
      next_action: nextAction,
      next_question: nextQuestion,
      interview_complete: interviewComplete
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Session not found' });
    }
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
