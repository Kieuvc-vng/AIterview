const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const sessionManager = require('../services/sessionManager');
const jobLibraryService = require('../services/jobLibraryService');
const { conductInterview, generateOpeningGreeting } = require('../services/aiIntegration');
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality, isInterviewComplete, moveToNextSkillIfNeeded } = require('../services/interviewEngine');
const summaryGenerator = require('../services/summaryGenerator');
const { generateRubric } = require('../services/rubricGenerator');

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

    // Add readiness confirmation prompt
    const readinessPrompt = "Please type anything (like 'Ready' or 'Yes') when you're ready to begin the interview.";
    await sessionManager.saveMessage(sessionId, {
      sender: 'ai',
      content: readinessPrompt,
      skill_name: null,
      question_index: null,
      attempt_number: null
    });

    const updatedData = await sessionManager.getSession(sessionId);

    res.json({
      session: updatedData.session,
      opening_message,
      readiness_prompt: readinessPrompt,
      current_question: null
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

    // Count only candidate messages (excluding AI messages)
    const candidateMessages = messages.filter(m => m.sender === 'candidate');
    const candidateMessageCount = candidateMessages.length; // Already includes the one we just saved

    console.log('[Interview] CandidateMessageCount:', candidateMessageCount, 'TotalMessages:', messages.length);

    // If this is the FIRST candidate message, just acknowledge readiness - don't ask questions yet
    if (candidateMessageCount === 1) {
      const acknowledgement = `Great! Thank you for confirming. Let's get started. ${allQuestions[0] ? allQuestions[0].question_text : 'No questions available'}`;

      // Save AI acknowledgement
      await sessionManager.saveMessage(interviewId, {
        sender: 'ai',
        content: acknowledgement,
        skill_name: allQuestions[0] ? allQuestions[0].skill : null,
        question_index: 0,
        attempt_number: 1
      });

      return res.json({
        ai_response: acknowledgement,
        answer_good: true,
        next_action: 'next_question',
        next_question: allQuestions[0] || null,
        interview_complete: false
      });
    }

    // For subsequent messages, proceed with normal question progression
    // Adjust question index: subtract 1 because first candidate message was just confirmation
    const adjustedAnswerCount = candidateMessageCount - 1; // -1 to exclude the readiness confirmation
    const nextQuestionIndex = Math.min(adjustedAnswerCount, allQuestions.length - 1);
    let nextQuestion = null;

    if (nextQuestionIndex + 1 < allQuestions.length) {
      nextQuestion = allQuestions[nextQuestionIndex + 1];
    }

    console.log('[Interview] AdjustedAnswerCount:', adjustedAnswerCount, 'NextQuestionIndex:', nextQuestionIndex + 1);

    // Get AI response
    const ai_response = nextQuestion
      ? `Thank you for your answer. ${nextQuestion.question_text}`
      : `Thank you for your responses. That concludes our interview. We'll be in touch soon!`;

    // Save AI response
    await sessionManager.saveMessage(interviewId, {
      sender: 'ai',
      content: ai_response,
      skill_name: nextQuestion ? nextQuestion.skill : null,
      question_index: nextQuestionIndex + 1,
      attempt_number: 1
    });

    const isComplete = !nextQuestion || (nextQuestionIndex + 1) >= allQuestions.length - 1;

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
 * GET /api/interview/:interviewId/summaries
 * Get all summaries for an interview
 */
router.get('/:interviewId/summaries', (req, res, next) => {
  try {
    const summaries = sessionManager.getSummaries(req.params.interviewId);
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

        // Generate AI evaluations and rubric for each skill
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

            // Generate rubric for all skills at once
            try {
              console.log('[Interview Submit] Generating rubric...');
              const rubrics = await generateRubric(messages, skills);
              console.log('[Interview Submit] Rubric generated:', rubrics?.length || 0, 'skills');

              // Save rubric data to summaries table
              for (const rubric of rubrics) {
                const stmt = db.prepare(`
                  UPDATE summaries
                  SET rubric_score = ?, rubric_evidence = ?, rubric_strengths = ?, rubric_weaknesses = ?
                  WHERE interview_id = ? AND skill_name = ?
                `);
                await stmt.run(
                  rubric.score,
                  rubric.evidence,
                  JSON.stringify(rubric.strengths),
                  JSON.stringify(rubric.weaknesses),
                  interviewId,
                  rubric.skill_name
                );
                console.log('[Interview Submit] Saved rubric for skill:', rubric.skill_name);
              }
            } catch (rubricError) {
              console.error('[Interview Submit] RUBRIC ERROR:', rubricError.message);
              // Continue even if rubric generation fails
            }

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
