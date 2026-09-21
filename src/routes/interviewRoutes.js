const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const sessionManager = require('../services/sessionManager');
const jobLibraryService = require('../services/jobLibraryService');
const { conductInterview, generateOpeningGreeting } = require('../services/aiIntegration');
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality, isInterviewComplete, moveToNextSkillIfNeeded } = require('../services/interviewEngine');
const summaryGenerator = require('../services/summaryGenerator');

/**
 * POST /api/interview/create-from-candidate
 * Create a new interview session from job and candidate IDs
 */
router.post('/create-from-candidate', async (req, res, next) => {
  try {
    const { jobId, candidateId } = req.body;

    if (!jobId || !candidateId) {
      return res.status(400).json({ error: 'Missing jobId or candidateId' });
    }

    // Fetch job details from job library
    const job = await jobLibraryService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create session using job data
    const sessionData = await sessionManager.createSession({
      hr_email: job.hr_email,
      job_title: job.job_title,
      level: job.level,
      company: job.company,
      skills: typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills,
      questions_by_skill: typeof job.questions_by_skill === 'string' ? JSON.parse(job.questions_by_skill) : job.questions_by_skill
    });

    res.json({ sessionId: sessionData.session_id });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

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

    // Get first question from questions_by_skill
    let currentQuestion = null;
    const questionsBySkill = typeof updatedData.session.questions_by_skill === 'string'
      ? JSON.parse(updatedData.session.questions_by_skill)
      : updatedData.session.questions_by_skill;

    if (questionsBySkill && Object.keys(questionsBySkill).length > 0) {
      const firstSkill = Object.keys(questionsBySkill)[0];
      const skillQuestions = questionsBySkill[firstSkill];
      if (skillQuestions && skillQuestions.length > 0) {
        currentQuestion = {
          skill: firstSkill,
          question_text: skillQuestions[0]
        };
      }
    }

    res.json({
      session: updatedData.session,
      opening_message,
      current_question: currentQuestion || {
        skill: 'TBD',
        question_text: 'No questions available'
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

/**
 * POST /api/interview/:interview_id/message
 * New: Send message with summary generation for new schema
 */
router.post('/:interview_id/message', async (req, res, next) => {
  try {
    const { interview_id } = req.params;
    const { content, sender } = req.body;

    if (!content || !sender) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const messageId = 'msg_' + uuidv4();
    sessionManager.addMessage(interview_id, messageId, sender, content);

    // Generate summary if candidate answered
    if (sender === 'candidate') {
      const interview = sessionManager.getInterview(interview_id);
      const messages = sessionManager.getInterviewMessages(interview_id);

      if (interview && messages.length > 0) {
        const lastQuestion = messages.find(m => m.sender === 'interviewer');
        if (lastQuestion) {
          const { main_answer_summary, followup_summary } = await summaryGenerator.generateSummary(
            interview_id,
            'skill',
            0,
            lastQuestion.content,
            messages
          );

          const summaryId = 'summary_' + uuidv4();
          if (sessionManager.db) {
            summaryGenerator.saveSummary(
              sessionManager.db,
              summaryId,
              interview_id,
              'skill',
              0,
              lastQuestion.content,
              main_answer_summary,
              followup_summary
            );
          }
        }
      }
    }

    res.json({ success: true, messageId });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * GET /api/interview/:interview_id/summaries
 * Get all summaries for an interview
 */
router.get('/:interview_id/summaries', (req, res, next) => {
  try {
    const summaries = sessionManager.getSummaries(req.params.interview_id);
    res.json({ success: true, summaries });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
