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
    const messageRecord = { id: message_id, session_id: sessionId, sender: message.sender, content: message.content, skill_name: message.skill_name || null, question_index: message.question_index || null, attempt_number: message.attempt_number || null, created_at: new Date().toISOString() };

    if (dbAvailable) {
      try {
        const stmt = db.prepare(`INSERT INTO messages (id, session_id, sender, content, skill_name, question_index, attempt_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(messageRecord.id, messageRecord.session_id, messageRecord.sender, messageRecord.content, messageRecord.skill_name, messageRecord.question_index, messageRecord.attempt_number, messageRecord.created_at);
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

  // Job methods
  getJobs() {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM jobs');
        return stmt.all();
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  getJob(job_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
        return stmt.get(job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return null;
  }

  saveJob(job) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare(`
          INSERT INTO jobs (id, job_title, level, company, description, skills, questions_by_skill, hr_email, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(job.id, job.job_title, job.level, job.company, job.description, job.skills, job.questions_by_skill, job.hr_email, job.created_at);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  updateJob(job_id, updates) {
    if (dbAvailable) {
      try {
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE jobs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        stmt.run(...values, job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  deleteJob(job_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('DELETE FROM jobs WHERE id = ?');
        stmt.run(job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  // Candidate methods
  getCandidatesByJob(job_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM candidates WHERE job_id = ?');
        return stmt.all(job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  getCandidate(candidate_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM candidates WHERE candidate_id = ?');
        return stmt.get(candidate_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return null;
  }

  saveCandidate(candidate) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare(`
          INSERT INTO candidates (candidate_id, job_id, name, email, phone, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(candidate.candidate_id, candidate.job_id, candidate.name, candidate.email, candidate.phone, candidate.created_at);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  // Interview methods
  createInterview(interview_id, job_id, candidate_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare(`
          INSERT INTO interviews (id, job_id, candidate_id, status, created_at)
          VALUES (?, ?, ?, 'setup', CURRENT_TIMESTAMP)
        `);
        stmt.run(interview_id, job_id, candidate_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  getInterview(interview_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM interviews WHERE id = ?');
        return stmt.get(interview_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return null;
  }

  getInterviewMessages(interview_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC');
        return stmt.all(interview_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  getSummaries(interview_id) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare('SELECT * FROM summaries WHERE interview_id = ? ORDER BY created_at ASC');
        return stmt.all(interview_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  addMessage(interview_id, messageId, sender, content) {
    if (dbAvailable) {
      try {
        const stmt = db.prepare(`
          INSERT INTO messages (id, interview_id, sender, content, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        stmt.run(messageId, interview_id, sender, content);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  _parseSession(dbSession) {
    return { ...dbSession, skills: typeof dbSession.skills === 'string' ? JSON.parse(dbSession.skills) : dbSession.skills, questions_by_skill: typeof dbSession.questions_by_skill === 'string' ? JSON.parse(dbSession.questions_by_skill) : dbSession.questions_by_skill };
  }

  _parseMessage(dbMessage) {
    return { id: dbMessage.id, message_id: dbMessage.id, sender: dbMessage.sender, content: dbMessage.content, skill_name: dbMessage.skill_name, question_index: dbMessage.question_index, attempt_number: dbMessage.attempt_number, created_at: dbMessage.created_at };
  }
}

module.exports = new SessionManager();
