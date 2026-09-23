const { v4: uuidv4 } = require('uuid');

let db = null;
let dbAvailable = false;
const initModule = require('../db/init');

// Initialize database reference
(async () => {
  try {
    db = await initModule.getDb?.() || initModule.db;
    if (db) {
      dbAvailable = true;
      console.log('[SessionManager] Database loaded');
    }
  } catch (error) {
    console.log('[SessionManager] Database not available, using in-memory store');
    dbAvailable = false;
  }
})();

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

    if (dbAvailable && db) {
      try {
        const stmt = db.prepare(`
          INSERT INTO sessions
          (session_id, hr_email, job_title, level, company, skills, questions_by_skill, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(session.session_id, session.hr_email, session.job_title, session.level, session.company, session.skills, session.questions_by_skill, session.status, session.created_at, session.updated_at);
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
    if (dbAvailable && db) {
      try {
        const sessionStmt = db.prepare('SELECT * FROM sessions WHERE session_id = ?');
        const session = await sessionStmt.get(sessionId);
        if (!session) return null;

        const messagesStmt = db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC');
        const messages = await messagesStmt.all(sessionId);

        return {
          session: this._parseSession(session),
          messages: messages.map(m => this._parseMessage(m)),
          current_position: { session_id: sessionId, current_skill_index: 0, current_question_index: 0, current_attempt: 1 }
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

  async updateInterview(sessionId, updates) {
    if (dbAvailable && db) {
      try {
        // Only update columns that exist in sessions table
        const validColumns = ['candidate_name', 'status'];
        const validUpdates = {};
        Object.keys(updates).forEach(k => {
          if (validColumns.includes(k)) {
            validUpdates[k] = updates[k];
          }
        });

        if (Object.keys(validUpdates).length === 0) return; // Nothing to update

        const setClause = Object.keys(validUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(validUpdates), sessionId];
        const stmt = db.prepare(`UPDATE sessions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`);
        await stmt.run(...values);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    } else {
      if (inMemoryStore.sessions[sessionId]) {
        Object.assign(inMemoryStore.sessions[sessionId], updates);
      }
    }
  }

  async startInterview(sessionId, candidateName) {
    if (dbAvailable && db) {
      try {
        const updateStmt = db.prepare(`UPDATE sessions SET candidate_name = ?, status = 'ongoing', updated_at = ? WHERE session_id = ?`);
        await updateStmt.run(candidateName, new Date().toISOString(), sessionId);
        // Note: session_states table not used in new schema
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

    if (dbAvailable && db) {
      try {
        const stmt = db.prepare(`INSERT INTO messages (id, interview_id, sender, content, skill_name, question_index, attempt_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        await stmt.run(messageRecord.id, sessionId, messageRecord.sender, messageRecord.content, messageRecord.skill_name, messageRecord.question_index, messageRecord.attempt_number, messageRecord.created_at);
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
    // Note: session_states table not used in new schema
    if (!inMemoryStore.states[sessionId]) inMemoryStore.states[sessionId] = {};
    Object.assign(inMemoryStore.states[sessionId], state);
  }

  async getSessionState(sessionId) {
    // Note: session_states table not used in new schema
    if (inMemoryStore.states[sessionId]) {
      return inMemoryStore.states[sessionId];
    }
    return { current_skill_index: 0, current_question_index: 0, current_attempt: 1 };
  }

  // Job methods
  async getJobs() {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('SELECT * FROM jobs');
        return await stmt.all();
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  async getJob(job_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
        return await stmt.get(job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return null;
  }

  async saveJob(job) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare(`
          INSERT INTO jobs (id, job_title, level, company, description, skills, questions_by_skill, hr_email, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(job.id, job.job_title, job.level, job.company, job.description, job.skills, job.questions_by_skill, job.hr_email, job.created_at);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  async updateJob(job_id, updates) {
    if (dbAvailable && db) {
      try {
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        const stmt = db.prepare(`UPDATE jobs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
        await stmt.run(...values, job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  async deleteJob(job_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('DELETE FROM jobs WHERE id = ?');
        await stmt.run(job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  // Candidate methods
  async getCandidatesByJob(job_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('SELECT * FROM candidates WHERE job_id = ?');
        return await stmt.all(job_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  async getCandidate(candidate_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('SELECT * FROM candidates WHERE id = ?');
        return await stmt.get(candidate_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return null;
  }

  async updateCandidateStatus(candidate_id, updates) {
    if (dbAvailable && db) {
      try {
        const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updates), candidate_id];
        const stmt = db.prepare(`UPDATE candidates SET ${setClause} WHERE id = ?`);
        await stmt.run(...values);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  async saveCandidate(candidate) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare(`
          INSERT INTO candidates (id, job_id, name, email, phone, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        await stmt.run(candidate.id, candidate.job_id, candidate.name, candidate.email, candidate.phone, candidate.created_at);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  // Interview methods
  async createInterview(interview_id, job_id, candidate_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare(`
          INSERT INTO interviews (id, job_id, candidate_id, status, created_at)
          VALUES (?, ?, ?, 'setup', CURRENT_TIMESTAMP)
        `);
        await stmt.run(interview_id, job_id, candidate_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
  }

  async getInterview(interview_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('SELECT * FROM interviews WHERE id = ?');
        return await stmt.get(interview_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return null;
  }

  async getInterviewMessages(interview_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC');
        return await stmt.all(interview_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  async getSummaries(interview_id) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare('SELECT * FROM summaries WHERE interview_id = ? ORDER BY created_at ASC');
        return await stmt.all(interview_id);
      } catch (error) {
        console.error('[SessionManager] DB error:', error.message);
      }
    }
    return [];
  }

  async addMessage(interview_id, messageId, sender, content) {
    if (dbAvailable && db) {
      try {
        const stmt = db.prepare(`
          INSERT INTO messages (id, interview_id, sender, content, created_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        await stmt.run(messageId, interview_id, sender, content);
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
