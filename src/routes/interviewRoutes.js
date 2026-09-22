const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const jobLibraryService = require('../services/jobLibraryService');
const { conductInterview, generateOpeningGreeting } = require('../services/aiIntegration');
const { initializeInterviewState, getCurrentQuestion, processAnswerQuality, isInterviewComplete, moveToNextSkillIfNeeded } = require('../services/interviewEngine');

let dbModule = null;
try {
  dbModule = require('../db/init');
} catch (error) {
  console.log('[interviewRoutes] Database module not available');
}

// In-memory store for when database is unavailable
const inMemoryStore = {
  interviews: {},
  messages: {},
  interviewStates: {}
};

/**
 * GET /api/interview/:interviewId
 * Get interview data with messages
 */
router.get('/:interviewId', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    let db = null;
    if (dbModule && dbModule.getDb) {
      db = await dbModule.getDb();
    }

    let interview, messages, job;

    if (db) {
      const interviews = await db.prepare('SELECT * FROM interviews WHERE id = ?').all(interviewId);
      if (!interviews || interviews.length === 0) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      interview = interviews[0];

      const jobs = await db.prepare('SELECT * FROM jobs WHERE id = ?').all(interview.job_id);
      job = jobs[0];

      const msgs = await db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC').all(interviewId);
      messages = msgs || [];
    } else {
      // In-memory fallback
      interview = inMemoryStore.interviews[interviewId];
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }
      job = inMemoryStore.jobs ? Object.values(inMemoryStore.jobs).find(j => j.id === interview.job_id) : null;
      messages = inMemoryStore.messages[interviewId] || [];
    }

    // Parse JSON fields
    if (job && typeof job.skills === 'string') {
      job.skills = JSON.parse(job.skills || '[]');
    }
    if (job && typeof job.questions_by_skill === 'string') {
      job.questions_by_skill = JSON.parse(job.questions_by_skill || '{}');
    }

    res.json({
      interview: {
        id: interview.id,
        job_id: interview.job_id,
        candidate_id: interview.candidate_id,
        job_title: job?.job_title,
        level: job?.level,
        company: job?.company,
        skills: job?.skills || [],
        questions_by_skill: job?.questions_by_skill || {},
        status: interview.status,
        created_at: interview.created_at
      },
      messages,
      state: inMemoryStore.interviewStates[interviewId] || { interview_id: interviewId, current_skill_index: 0, current_question_index: 0, current_attempt: 1 }
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/interview/start
 * Start interview - create interview from job_id + candidate_name
 */
router.post('/start', async (req, res, next) => {
  try {
    const { job_id, candidate_name } = req.body;

    if (!job_id || !candidate_name) {
      return res.status(400).json({ error: 'Missing required parameters: job_id, candidate_name' });
    }

    // Get job details
    const job = await jobLibraryService.getJobById(job_id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let db = null;
    if (dbModule && dbModule.getDb) {
      db = await dbModule.getDb();
    }

    const interview_id = 'interview_' + uuidv4();
    const candidate_id = 'candidate_' + uuidv4();
    const now = new Date().toISOString();

    let interview, candidate;

    if (db) {
      // Create candidate record
      const candidateRecord = {
        id: candidate_id,
        job_id,
        name: candidate_name,
        phone: 'N/A',
        email: `${candidate_name.replace(/\s+/g, '_').toLowerCase()}@temp.local`,
        link_sent: 1,
        interview_status: 'in_progress',
        interview_link: `/interview.html?interview_id=${interview_id}`,
        created_at: now
      };

      const candidateStmt = db.prepare(
        'INSERT INTO candidates (id, job_id, name, phone, email, link_sent, interview_status, interview_link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      candidateStmt.run(candidate_id, job_id, candidate_name, 'N/A', candidateRecord.email, 1, 'in_progress', candidateRecord.interview_link, now);
      candidate = candidateRecord;

      // Create interview record
      const interviewRecord = {
        id: interview_id,
        job_id,
        candidate_id,
        status: 'active',
        started_at: now,
        created_at: now
      };

      const interviewStmt = db.prepare(
        'INSERT INTO interviews (id, job_id, candidate_id, status, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      );
      interviewStmt.run(interview_id, job_id, candidate_id, 'active', now, now);
      interview = interviewRecord;
    } else {
      // In-memory fallback
      candidate = {
        id: candidate_id,
        job_id,
        name: candidate_name,
        phone: 'N/A',
        email: `${candidate_name.replace(/\s+/g, '_').toLowerCase()}@temp.local`,
        created_at: now
      };

      interview = {
        id: interview_id,
        job_id,
        candidate_id,
        status: 'active',
        started_at: now,
        created_at: now
      };

      inMemoryStore.interviews[interview_id] = interview;
      inMemoryStore.interviews[job_id] = interview;
    }

    // Initialize interview state
    inMemoryStore.interviewStates[interview_id] = {
      interview_id,
      current_skill_index: 0,
      current_question_index: 0,
      current_attempt: 1
    };
    inMemoryStore.messages[interview_id] = [];

    // Generate opening greeting
    const opening_message = await generateOpeningGreeting(job.job_title, job.level, candidate_name);

    // Save opening message
    const message_id = 'msg_' + uuidv4();
    const messageRecord = {
      id: message_id,
      interview_id,
      sender: 'ai',
      content: opening_message,
      created_at: now
    };

    if (db) {
      const msgStmt = db.prepare(
        'INSERT INTO messages (id, interview_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      msgStmt.run(message_id, interview_id, 'ai', opening_message, now);
    }

    inMemoryStore.messages[interview_id].push(messageRecord);

    res.json({
      interview_id,
      candidate_id,
      job_title: job.job_title,
      level: job.level,
      company: job.company,
      skills: typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills,
      questions_by_skill: typeof job.questions_by_skill === 'string' ? JSON.parse(job.questions_by_skill) : job.questions_by_skill,
      opening_message,
      current_question: {
        skill: 'Opening',
        question: 'Interview started'
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

    let db = null;
    if (dbModule && dbModule.getDb) {
      db = await dbModule.getDb();
    }

    const now = new Date().toISOString();

    // Save candidate message
    const message_id = 'msg_' + uuidv4();
    const messageRecord = {
      id: message_id,
      interview_id: interviewId,
      sender: 'candidate',
      content: candidate_message,
      created_at: now
    };

    if (db) {
      const msgStmt = db.prepare(
        'INSERT INTO messages (id, interview_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      msgStmt.run(message_id, interviewId, 'candidate', candidate_message, now);
    }

    if (inMemoryStore.messages[interviewId]) {
      inMemoryStore.messages[interviewId].push(messageRecord);
    }

    // Get AI response
    const ai_response = `Thank you for that answer. Let me follow up on what you said...`;

    // Save AI response
    const ai_message_id = 'msg_' + uuidv4();
    const aiMessageRecord = {
      id: ai_message_id,
      interview_id: interviewId,
      sender: 'ai',
      content: ai_response,
      created_at: new Date().toISOString()
    };

    if (db) {
      const msgStmt = db.prepare(
        'INSERT INTO messages (id, interview_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)'
      );
      msgStmt.run(ai_message_id, interviewId, 'ai', ai_response, aiMessageRecord.created_at);
    }

    if (inMemoryStore.messages[interviewId]) {
      inMemoryStore.messages[interviewId].push(aiMessageRecord);
    }

    // Get job details to find next question
    let nextQuestion = null;
    let interviewComplete = false;

    try {
      const interview = inMemoryStore.interviewStates[interviewId];
      if (interview) {
        const job = await jobLibraryService.getJobById(interview.job_id);
        if (job) {
          const skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
          const questionsData = typeof job.questions_by_skill === 'string' ? JSON.parse(job.questions_by_skill) : job.questions_by_skill;

          let skillIndex = interview.current_skill_index || 0;
          let questionIndex = (interview.current_question_index || 0) + 1;

          // Check if need to move to next skill
          if (questionsData[skills[skillIndex]] && questionIndex >= questionsData[skills[skillIndex]].length) {
            skillIndex++;
            questionIndex = 0;
          }

          // Check if interview complete
          if (skillIndex >= skills.length) {
            interviewComplete = true;
          } else if (questionsData[skills[skillIndex]] && questionsData[skills[skillIndex]][questionIndex]) {
            nextQuestion = {
              skill: skills[skillIndex],
              question_text: questionsData[skills[skillIndex]][questionIndex]
            };
          }

          // Update state
          interview.current_skill_index = skillIndex;
          interview.current_question_index = questionIndex;
        }
      }
    } catch (e) {
      console.error('Error calculating next question:', e.message);
    }

    res.json({
      ai_response,
      answer_good: true,
      next_action: 'next_question',
      next_question: nextQuestion,
      interview_complete: interviewComplete
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
