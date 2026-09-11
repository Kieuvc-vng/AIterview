const { v4: uuidv4 } = require('uuid');

let db = null;
let dbAvailable = false;

// Try to load database if available
try {
  db = require('../db/init');
  dbAvailable = true;
  console.log('[SessionManager] Database loaded');
} catch (error) {
  console.log('[SessionManager] Database not available, using in-memory store');
  dbAvailable = false;
}

// In-memory store for when database is unavailable
const inMemoryStore = {
  sessions: {},
  messages: {},
  states: {}
};

class SessionManager {
  async createSession(data) {
    const session_id = uuidv4();
    const session = {
      session_id,
      hr_email: data.hr_email,
      job_title: data.job_title,
      level: data.level,
      company: data.company,
      skills: JSON.stringify(data.skills || []),
      questions_by_skill: JSON.stringify(data.questions_by_skill || {}),
      candidate_name: null,
      status: 'setup',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (dbAvailable) {
      try {
        const stmt = db.prepare(`
          INSERT INTO sessions
          (session_id, hr_email, job_title, level, company, skills, questions_by_skill, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(session.session_id, session.hr_email, session.job_title, session.level, session.company, session.skills, session.questions_by_skill, session.status, session.created_at, session.updated_at);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
        inMemoryStore.sessions[session_id] = session;
      }
    } else {
      inMemoryStore.sessions[session_id] = session;
      inMemoryStore.messages[session_id] = [];
      inMemoryStore.states[session_id] = { session_id, current_skill_index: 0, current_question_index: 0, current_attempt: 1 };
    }

    return { session_id: session.session_id };
  }

  async getSession(sessionId) {
    if (dbAvailable) {
      try {
        const sessionStmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
        const session = sessionStmt.get(sessionId);
        if (!session) return null;

        const messagesStmt = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC');
        const messages = messagesStmt.all(sessionId);

        const stateStmt = db.prepare('SELECT * FROM session_states WHERE session_id = ?');
        const state = stateStmt.get(sessionId);

        return {
          session: this._parseSession(session),
          messages: messages.map(m => this._parseMessage(m)),
          current_position: state || { session_id: sessionId, current_skill_index: 0, current_question_index: 0, current_attempt: 1 }
        };
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }

    if (inMemoryStore.sessions[sessionId]) {
      return {
        session: this._parseSession(inMemoryStore.sessions[sessionId]),
        messages: inMemoryStore.messages[sessionId] || [],
        current_position: inMemoryStore.states[sessionId] || { current_skill_index: 0, current_question_index: 0, current_attempt: 1 }
      };
    }
    return null;
  }

  async startInterview(sessionId, candidateName) {
    if (dbAvailable) {
      try {
        const updateStmt = db.prepare(`UPDATE sessions SET candidate_name = ?, status = 'ongoing', updated_at = ? WHERE session_id = ?`);
        updateStmt.run(candidateName, new Date().toISOString(), sessionId);
        const stateStmt = db.prepare(`INSERT OR REPLACE INTO session_states (session_id, interview_started_at) VALUES (?, ?)`);
        stateStmt.run(sessionId, new Date().toISOString());
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    } else {
      if (inMemoryStore.sessions[sessionId]) {
        inMemoryStore.sessions[sessionId].candidate_name = candidateName;
        inMemoryStore.sessions[sessionId].status = 'ongoing';
      }
    }
    return { success: true };
  }

  async saveMessage(sessionId, message) {
    const message_id = uuidv4();
    const messageRecord = { message_id, session_id: sessionId, sender: message.sender, content: message.content, skill_name: message.skill_name || null, question_index: message.question_index || null, attempt_number: message.attempt_number || null, created_at: new Date().toISOString() };

    if (dbAvailable) {
      try {
        const stmt = db.prepare(`INSERT INTO messages (message_id, session_id, sender, content, skill_name, question_index, attempt_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(messageRecord.message_id, messageRecord.session_id, messageRecord.sender, messageRecord.content, messageRecord.skill_name, messageRecord.question_index, messageRecord.attempt_number, messageRecord.created_at);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
        if (!inMemoryStore.messages[sessionId]) inMemoryStore.messages[sessionId] = [];
        inMemoryStore.messages[sessionId].push(messageRecord);
      }
    } else {
      if (!inMemoryStore.messages[sessionId]) inMemoryStore.messages[sessionId] = [];
      inMemoryStore.messages[sessionId].push(messageRecord);
    }
    return { message_id };
  }

  async updateSessionState(sessionId, state) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare(`INSERT OR REPLACE INTO session_states (session_id, current_skill_index, current_question_index, current_attempt) VALUES (?, ?, ?, ?)`);
        stmt.run(sessionId, state.current_skill_index || 0, state.current_question_index || 0, state.current_attempt || 1);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
        if (!inMemoryStore.states[sessionId]) inMemoryStore.states[sessionId] = {};
        Object.assign(inMemoryStore.states[sessionId], state);
      }
    } else {
      if (!inMemoryStore.states[sessionId]) inMemoryStore.states[sessionId] = { session_id: sessionId, current_skill_index: 0, current_question_index: 0, current_attempt: 1 };
      Object.assign(inMemoryStore.states[sessionId], state);
    }
  }

  async getSessionState(sessionId) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM session_states WHERE session_id = ?');
        const state = stmt.get(sessionId);
        return state || { current_skill_index: 0, current_question_index: 0, current_attempt: 1 };
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return inMemoryStore.states[sessionId] || { current_skill_index: 0, current_question_index: 0, current_attempt: 1 };
  }

  _parseSession(dbSession) {
    return { ...dbSession, skills: typeof dbSession.skills === 'string' ? JSON.parse(dbSession.skills) : dbSession.skills, questions_by_skill: typeof dbSession.questions_by_skill === 'string' ? JSON.parse(dbSession.questions_by_skill) : dbSession.questions_by_skill };
  }

  _parseMessage(dbMessage) {
    return { message_id: dbMessage.message_id, sender: dbMessage.sender, content: dbMessage.content, skill_name: dbMessage.skill_name, question_index: dbMessage.question_index, attempt_number: dbMessage.attempt_number, created_at: dbMessage.created_at };
  }
}

module.exports = new SessionManager();
