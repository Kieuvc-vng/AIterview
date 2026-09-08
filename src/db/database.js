const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../interview.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Session queries
const getSession = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
  return stmt.get(sessionId);
};

const createSession = (sessionId, hrEmail, jobTitle, level, company, skills, questionsBySkill) => {
  const stmt = db.prepare(`
    INSERT INTO sessions (session_id, hr_email, job_title, level, company, skills, questions_by_skill)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, hrEmail, jobTitle, level, company, JSON.stringify(skills), JSON.stringify(questionsBySkill));
};

const updateSessionStatus = (sessionId, status, candidateName = null) => {
  let query = 'UPDATE sessions SET status = ?';
  const params = [status];
  if (candidateName) {
    query += ', candidate_name = ?, started_at = CURRENT_TIMESTAMP';
    params.push(candidateName);
  }
  query += ' WHERE session_id = ?';
  params.push(sessionId);
  const stmt = db.prepare(query);
  return stmt.run(...params);
};

// Message queries
const addMessage = (sessionId, sender, content, skillName = null, questionIndex = null, attemptNumber = null) => {
  const stmt = db.prepare(`
    INSERT INTO messages (session_id, sender, content, skill_being_evaluated, question_index, attempt_number)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, sender, content, skillName, questionIndex, attemptNumber);
};

const getMessages = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
  return stmt.all(sessionId);
};

// Rubric queries
const addRubric = (sessionId, skillName, score, evidence, strengths, weaknesses) => {
  const stmt = db.prepare(`
    INSERT INTO rubrics (session_id, skill_name, score, evidence, strengths, weaknesses)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(sessionId, skillName, score, evidence, JSON.stringify(strengths), JSON.stringify(weaknesses));
};

const getRubrics = (sessionId) => {
  const stmt = db.prepare('SELECT * FROM rubrics WHERE session_id = ?');
  return stmt.all(sessionId);
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
