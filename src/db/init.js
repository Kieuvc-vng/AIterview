const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../interview.db');
const db = new Database(dbPath);

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      hr_email TEXT,
      job_title TEXT,
      level TEXT,
      company TEXT,
      skills TEXT,
      questions_by_skill TEXT,
      candidate_name TEXT,
      status TEXT DEFAULT 'setup',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME
    );
  `);

  // Create messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      skill_being_evaluated TEXT,
      question_index INTEGER,
      attempt_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    );
  `);

  // Create rubrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rubrics (
      rubric_id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      score REAL,
      evidence TEXT,
      strengths TEXT,
      weaknesses TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    );
  `);

  console.log('Database initialized:', dbPath);
} catch (error) {
  console.error('Database initialization error:', error.message);
  process.exit(1);
}

module.exports = db;
