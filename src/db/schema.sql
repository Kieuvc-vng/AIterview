-- Browser Token Persistence Schema
-- Created: 2026-09-11
-- Tables: sessions, messages, session_states, rubrics

-- 1. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  hr_email TEXT NOT NULL,
  candidate_name TEXT,
  job_title TEXT NOT NULL,
  level TEXT NOT NULL,
  company TEXT NOT NULL,
  skills TEXT NOT NULL,
  questions_by_skill TEXT NOT NULL,
  status TEXT DEFAULT 'setup',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  skill_name TEXT,
  question_index INTEGER,
  attempt_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- 3. Session States Table
CREATE TABLE IF NOT EXISTS session_states (
  session_id TEXT PRIMARY KEY,
  current_skill_index INTEGER DEFAULT 0,
  current_question_index INTEGER DEFAULT 0,
  current_attempt INTEGER DEFAULT 1,
  interview_started_at TIMESTAMP,
  interview_completed_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- 4. Rubrics Table
CREATE TABLE IF NOT EXISTS rubrics (
  rubric_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  score INTEGER,
  evidence TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_session_id ON rubrics(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
