const db = require('./init');

// Input validation helper
const validateSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new Error('Invalid sessionId: must be a non-empty string');
  }
};

// Session queries
const getSession = (sessionId) => {
  try {
    validateSessionId(sessionId);
    const stmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
    return stmt.get(sessionId);
  } catch (error) {
    console.error('Error in getSession:', error.message);
    throw error;
  }
};

const createSession = (sessionId, hrEmail, jobTitle, level, company, skills, questionsBySkill) => {
  try {
    validateSessionId(sessionId);
    const stmt = db.prepare(`
      INSERT INTO sessions (session_id, hr_email, job_title, level, company, skills, questions_by_skill)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(sessionId, hrEmail, jobTitle, level, company, JSON.stringify(skills), JSON.stringify(questionsBySkill));
  } catch (error) {
    console.error('Error in createSession:', error.message);
    throw error;
  }
};

const updateSessionStatus = (sessionId, status, candidateName = null) => {
  try {
    validateSessionId(sessionId);
    if (!status || typeof status !== 'string') {
      throw new Error('Invalid status: must be a non-empty string');
    }

    // Use separate prepared statements to avoid dynamic SQL
    if (candidateName) {
      const stmt = db.prepare(`
        UPDATE sessions
        SET status = ?, candidate_name = ?, started_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `);
      return stmt.run(status, candidateName, sessionId);
    } else {
      const stmt = db.prepare(`
        UPDATE sessions
        SET status = ?
        WHERE session_id = ?
      `);
      return stmt.run(status, sessionId);
    }
  } catch (error) {
    console.error('Error in updateSessionStatus:', error.message);
    throw error;
  }
};

// Message queries
const addMessage = (sessionId, sender, content, skillName = null, questionIndex = null, attemptNumber = null) => {
  try {
    validateSessionId(sessionId);
    if (!sender || typeof sender !== 'string') {
      throw new Error('Invalid sender: must be a non-empty string');
    }
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content: must be a non-empty string');
    }

    const stmt = db.prepare(`
      INSERT INTO messages (session_id, sender, content, skill_being_evaluated, question_index, attempt_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(sessionId, sender, content, skillName, questionIndex, attemptNumber);
  } catch (error) {
    console.error('Error in addMessage:', error.message);
    throw error;
  }
};

const getMessages = (sessionId) => {
  try {
    validateSessionId(sessionId);
    const stmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
    return stmt.all(sessionId);
  } catch (error) {
    console.error('Error in getMessages:', error.message);
    throw error;
  }
};

// Rubric queries
const addRubric = (sessionId, skillName, score, evidence, strengths, weaknesses) => {
  try {
    validateSessionId(sessionId);
    if (!skillName || typeof skillName !== 'string') {
      throw new Error('Invalid skillName: must be a non-empty string');
    }

    const stmt = db.prepare(`
      INSERT INTO rubrics (session_id, skill_name, score, evidence, strengths, weaknesses)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(sessionId, skillName, score, evidence, JSON.stringify(strengths), JSON.stringify(weaknesses));
  } catch (error) {
    console.error('Error in addRubric:', error.message);
    throw error;
  }
};

const getRubrics = (sessionId) => {
  try {
    validateSessionId(sessionId);
    const stmt = db.prepare('SELECT * FROM rubrics WHERE session_id = ?');
    return stmt.all(sessionId);
  } catch (error) {
    console.error('Error in getRubrics:', error.message);
    throw error;
  }
};

module.exports = {
  db,
  getSession,
  createSession,
  updateSessionStatus,
  addMessage,
  getMessages,
  addRubric,
  getRubrics
};
