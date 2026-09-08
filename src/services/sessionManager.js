const { v4: uuidv4 } = require('uuid');
const {
  createSession,
  getSession,
  updateSessionStatus,
  addMessage,
  getMessages,
  addRubric,
  getRubrics
} = require('../db/database');

/**
 * Create a new interview session
 * @param {string} hrEmail - HR's email
 * @param {string} jobTitle - Job title
 * @param {string} level - Level (Junior/Mid/Senior)
 * @param {string} company - Company name
 * @param {Array} skills - Array of skill objects: { name: string, questions: [string] }
 * @param {Object} questionsBySkill - Object with skill names as keys and arrays of questions as values
 * @returns {Object} { session_id, interview_link }
 */
const createNewSession = (hrEmail, jobTitle, level, company, skills, questionsBySkill) => {
  try {
    const sessionId = uuidv4();
    const interviewLink = `/interview/${sessionId}`;

    createSession(sessionId, hrEmail, jobTitle, level, company, skills, questionsBySkill);

    return {
      session_id: sessionId,
      interview_link: interviewLink
    };
  } catch (error) {
    console.error('Error creating new session:', error.message);
    throw new Error(`Failed to create session: ${error.message}`);
  }
};

/**
 * Get session data by session ID
 * @param {string} sessionId - Session ID
 * @returns {Object} Session data
 */
const getSessionData = (sessionId) => {
  try {
    const session = getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Parse JSON fields
    return {
      session_id: session.session_id,
      hr_email: session.hr_email,
      job_title: session.job_title,
      level: session.level,
      company: session.company,
      skills: JSON.parse(session.skills),
      questions_by_skill: JSON.parse(session.questions_by_skill),
      candidate_name: session.candidate_name,
      status: session.status,
      created_at: session.created_at,
      started_at: session.started_at,
      completed_at: session.completed_at
    };
  } catch (error) {
    console.error('Error getting session data:', error.message);
    throw error;
  }
};

/**
 * Start an interview (set status to in_progress, save candidate name)
 * @param {string} sessionId - Session ID
 * @param {string} candidateName - Candidate's name
 * @returns {Object} Updated session data
 */
const startInterview = (sessionId, candidateName) => {
  try {
    updateSessionStatus(sessionId, 'in_progress', candidateName);
    return getSessionData(sessionId);
  } catch (error) {
    console.error('Error starting interview:', error.message);
    throw error;
  }
};

/**
 * End an interview (set status to completed)
 * @param {string} sessionId - Session ID
 * @returns {Object} Updated session data
 */
const endInterview = (sessionId) => {
  try {
    updateSessionStatus(sessionId, 'completed');
    return getSessionData(sessionId);
  } catch (error) {
    console.error('Error ending interview:', error.message);
    throw error;
  }
};

/**
 * Save a message to the session
 * @param {string} sessionId - Session ID
 * @param {string} sender - 'ai' or 'candidate'
 * @param {string} content - Message content
 * @param {string} skillName - Skill being evaluated (optional)
 * @param {number} questionIndex - Question index (optional)
 * @param {number} attemptNumber - Attempt number (optional)
 * @returns {Object} Message data
 */
const saveMessage = (sessionId, sender, content, skillName = null, questionIndex = null, attemptNumber = null) => {
  try {
    const result = addMessage(sessionId, sender, content, skillName, questionIndex, attemptNumber);
    return {
      message_id: result.lastID,
      session_id: sessionId,
      sender,
      content,
      skill_being_evaluated: skillName,
      question_index: questionIndex,
      attempt_number: attemptNumber
    };
  } catch (error) {
    console.error('Error saving message:', error.message);
    throw error;
  }
};

/**
 * Get all messages for a session
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of messages
 */
const getSessionMessages = (sessionId) => {
  try {
    return getMessages(sessionId);
  } catch (error) {
    console.error('Error getting session messages:', error.message);
    throw error;
  }
};

/**
 * Add a skill rubric for a session
 * @param {string} sessionId - Session ID
 * @param {string} skillName - Skill name
 * @param {number} score - Score (0-10)
 * @param {string} evidence - Evidence from chat
 * @param {Array} strengths - Array of strengths
 * @param {Array} weaknesses - Array of weaknesses
 * @returns {Object} Rubric data
 */
const addSkillRubric = (sessionId, skillName, score, evidence, strengths = [], weaknesses = []) => {
  try {
    const result = addRubric(sessionId, skillName, score, evidence, strengths, weaknesses);
    return {
      rubric_id: result.lastID,
      session_id: sessionId,
      skill_name: skillName,
      score,
      evidence,
      strengths,
      weaknesses
    };
  } catch (error) {
    console.error('Error adding skill rubric:', error.message);
    throw error;
  }
};

/**
 * Get all rubrics for a session
 * @param {string} sessionId - Session ID
 * @returns {Array} Array of rubrics
 */
const getSessionRubric = (sessionId) => {
  try {
    const rubrics = getRubrics(sessionId);
    return rubrics.map(r => ({
      rubric_id: r.rubric_id,
      session_id: r.session_id,
      skill_name: r.skill_name,
      score: r.score,
      evidence: r.evidence,
      strengths: JSON.parse(r.strengths),
      weaknesses: JSON.parse(r.weaknesses),
      created_at: r.created_at
    }));
  } catch (error) {
    console.error('Error getting session rubric:', error.message);
    throw error;
  }
};

module.exports = {
  createNewSession,
  getSessionData,
  startInterview,
  endInterview,
  saveMessage,
  getSessionMessages,
  addSkillRubric,
  getSessionRubric
};
