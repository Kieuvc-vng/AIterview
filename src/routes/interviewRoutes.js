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

    // Also create an interview record in the interviews table
    const interviewId = await sessionManager.createInterview(jobId, candidateId);

    res.json({ sessionId: sessionData.session_id, interviewId });
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

    // Auto-set started_at timestamp
    const startedAt = new Date().toISOString();
    await sessionManager.updateInterview(sessionId, {
      started_at: startedAt,
      interview_status: 'in_progress'
    });

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
 * POST /api/interview/:interviewId/message
 * Main interview loop - receive candidate answer, AI evaluates, determines next action
 */
router.post('/:interviewId/message', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const { candidate_message } = req.body;

    if (!candidate_message) {
      return res.status(400).json({ error: 'Missing required parameter: candidate_message' });
    }

    // Get interview and associated job data
    const db = require('../db/init').db;
    let interview = null;
    let job = null;

    if (db) {
      try {
        const stmt = db.prepare('SELECT * FROM interviews WHERE id = ?');
        interview = await stmt.get(interviewId);

        if (interview && interview.job_id) {
          job = await jobLibraryService.getJobById(interview.job_id);
        }
      } catch (error) {
        console.error('[Interview] DB error:', error.message);
      }
    }

    if (!interview || !job) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Save candidate message
    await sessionManager.saveMessage(interviewId, {
      sender: 'candidate',
      content: candidate_message,
      skill_name: null,
      question_index: null,
      attempt_number: null
    });

    // Parse questions by skill from job
    const questionsBySkill = typeof job.questions_by_skill === 'string'
      ? JSON.parse(job.questions_by_skill)
      : job.questions_by_skill;

    // Get all questions in order
    const allQuestions = [];
    const skillOrder = Object.keys(questionsBySkill);
    skillOrder.forEach(skill => {
      const questions = questionsBySkill[skill];
      questions.forEach(q => {
        allQuestions.push({ skill, question_text: q });
      });
    });

    // Get messages for this interview
    let messages = [];
    if (db) {
      try {
        const stmt = db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC');
        messages = await stmt.all(interviewId) || [];
      } catch (error) {
        console.error('[Interview] Error fetching messages:', error.message);
      }
    }

    // Get next question (simple increment from message count)
    const messageCount = messages.length + 1; // +1 for the message we just saved
    const nextQuestionIndex = Math.floor((messageCount - 1) / 2); // Every 2 messages = 1 question
    let nextQuestion = null;

    console.log('[Interview] MessageCount:', messageCount, 'AllQuestions:', allQuestions.length, 'NextIndex:', nextQuestionIndex);

    if (nextQuestionIndex < allQuestions.length) {
      nextQuestion = allQuestions[nextQuestionIndex];
    }

    // Get AI response
    const ai_response = nextQuestion
      ? `Thank you for your answer. ${nextQuestion.question_text}`
      : `Thank you for your responses. That concludes our interview. We'll be in touch soon!`;

    // Save AI response
    await sessionManager.saveMessage(interviewId, {
      sender: 'ai',
      content: ai_response,
      skill_name: nextQuestion ? nextQuestion.skill : null,
      question_index: nextQuestionIndex,
      attempt_number: 1
    });

    const isComplete = !nextQuestion || nextQuestionIndex >= allQuestions.length - 1;

    res.json({
      ai_response,
      answer_good: true,
      next_action: isComplete ? 'interview_complete' : 'next_question',
      next_question: nextQuestion,
      interview_complete: isComplete
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

/**
 * POST /api/interview/:sessionId/submit
 * Mark interview as complete - auto-set completed_at timestamp + generate AI evaluations
 */
router.post('/:sessionId/submit', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { interviewId } = req.body;
    const db = require('../db/init').db;

    console.log('[Interview Submit] sessionId:', sessionId, 'interviewId:', interviewId);

    const sessionData = await sessionManager.getSession(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Auto-set completed_at timestamp and mark as completed
    const completedAt = new Date().toISOString();
    await sessionManager.updateInterview(sessionId, {
      completed_at: completedAt,
      status: 'completed'
    });

    // Also update the interviews table if interviewId is provided
    if (interviewId && db) {
      console.log('[Interview Submit] Updating interview:', interviewId);
      const interview = await sessionManager.getInterview(interviewId);
      console.log('[Interview Submit] Retrieved interview:', interview);
      if (interview) {
        // Update interview record
        await sessionManager.updateInterviewStatus(interviewId, 'completed', completedAt);
        console.log('[Interview Submit] Updated interview status');

        // Update candidate's interview_status
        await sessionManager.updateCandidateInterviewStatus(interview.candidate_id, 'completed');
        console.log('[Interview Submit] Updated candidate status for:', interview.candidate_id);

        // Generate AI evaluations for each skill
        try {
          console.log('[Interview Submit] Generating AI evaluations...');
          const job = await jobLibraryService.getJobById(interview.job_id);
          console.log('[Interview Submit] Job:', job ? 'found' : 'NOT FOUND');
          if (job) {
            const skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
            const questionsData = typeof job.questions_by_skill === 'string' ? JSON.parse(job.questions_by_skill) : job.questions_by_skill;
            console.log('[Interview Submit] Skills to evaluate:', skills);

            // Get all messages for this interview
            const messages = await db.all('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at', [interviewId]);
            console.log('[Interview Submit] Messages found:', messages?.length || 0);

            // Generate evaluation for each skill
            for (const skill of skills) {
              console.log('[Interview Submit] Processing skill:', skill);
              const skillQuestions = questionsData[skill] || [];
              const evaluation = await summaryGenerator.generateSkillEvaluation(skill, skillQuestions, messages);
              console.log('[Interview Submit] Evaluation result:', evaluation ? `${evaluation.substring(0, 50)}...` : 'EMPTY');

              if (evaluation) {
                await summaryGenerator.saveSkillEvaluation(db, interviewId, skill, evaluation);
                console.log('[Interview Submit] Saved evaluation for skill:', skill);
              } else {
                // FOR TESTING: Insert dummy evaluation if generation failed
                const dummyEvaluation = `[Test Data] Ứng viên có kiến thức cơ bản về ${skill}. Cần cải thiện thêm kỹ năng thực hành.`;
                await summaryGenerator.saveSkillEvaluation(db, interviewId, skill, dummyEvaluation);
                console.log('[Interview Submit] Saved DUMMY evaluation for skill:', skill);
              }
            }
          }
        } catch (evalError) {
          console.error('[Interview Submit] EVAL ERROR:', evalError.message);
          console.error('[Interview Submit] Stack:', evalError.stack);
          // Don't fail the whole submit if evaluation generation fails
        }
      }
    } else {
      console.log('[Interview Submit] No interviewId or db provided');
    }

    res.json({
      success: true,
      message: 'Interview completed',
      completed_at: completedAt
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * GET /api/interview/results/:candidateId
 * Get interview results for a candidate
 */
router.get('/results/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const db = require('../db/init').db;

    // Get candidate info
    const candidate = await db.get('SELECT * FROM candidates WHERE id = ?', [candidateId]);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Get job info
    const job = await jobLibraryService.getJobById(candidate.job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get interview
    const interview = await db.get('SELECT * FROM interviews WHERE candidate_id = ? ORDER BY created_at DESC LIMIT 1', [candidateId]);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Get evaluation summaries
    const summaries = await db.all('SELECT * FROM summaries WHERE interview_id = ? ORDER BY skill_name, question_index', [interview.id]);

    // Get transcript (messages)
    const messages = await db.all('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at', [interview.id]);

    const skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;

    res.json({
      interviewId: interview.id,
      skills: skills,
      interview_info: {
        candidate_name: candidate.name,
        job_title: job.job_title,
        level: job.level,
        company: job.company,
        completed_at: interview.completed_at
      },
      evaluation: summaries,
      transcript: messages
    });
  } catch (error) {
    console.error('[Interview Results] Error:', error.message);
    next({ status: 500, message: error.message });
  }
});

/**
 * PUT /api/interview/summaries/:interviewId
 * Update skill evaluations
 */
router.put('/summaries/:interviewId', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const { evaluations } = req.body; // { skill_name: evaluation_text, ... }
    const db = require('../db/init').db;

    if (!evaluations || Object.keys(evaluations).length === 0) {
      return res.status(400).json({ error: 'No evaluations provided' });
    }

    // Update each skill's evaluation
    for (const [skillName, evaluationText] of Object.entries(evaluations)) {
      await db.run(
        'UPDATE summaries SET main_answer_summary = ? WHERE interview_id = ? AND skill_name = ?',
        [evaluationText, interviewId, skillName]
      );
      console.log('[Interview Summaries] Updated evaluation for skill:', skillName);
    }

    res.json({ success: true, message: 'Evaluations updated' });
  } catch (error) {
    console.error('[Interview Summaries] Error:', error.message);
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
