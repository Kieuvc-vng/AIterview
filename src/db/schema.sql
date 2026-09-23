-- Job Library & Summarization Schema
-- Created: 2026-09-13

-- 1. JOBS Table (Job Templates)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  hr_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('Fresher', 'Junior', 'Mid', 'Senior', 'Lead', 'Manager')),
  company TEXT NOT NULL,
  -- skills: JSON array of skill names, e.g. ["Python", "React", "SQL"]
  skills TEXT NOT NULL,
  -- questions_by_skill: JSON object mapping skill names to arrays of questions, e.g. {"Python": [{"question": "...", "model": "..."}, ...], ...}
  questions_by_skill TEXT NOT NULL,
  jd_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CANDIDATES Table
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  link_sent BOOLEAN DEFAULT 0,
  link_sent_at TIMESTAMP,
  interview_status TEXT DEFAULT 'not_started' CHECK(interview_status IN ('not_started', 'in_progress', 'completed')),
  interview_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  UNIQUE(job_id, email)
);

-- 3. INTERVIEWS Table
CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  status TEXT DEFAULT 'setup' CHECK(status IN ('setup', 'active', 'completed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

-- 4. MESSAGES Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  skill_name TEXT,
  question_index INTEGER,
  attempt_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);

-- 5. SUMMARIES Table
CREATE TABLE IF NOT EXISTS summaries (
  id TEXT PRIMARY KEY,
  interview_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  main_answer_summary TEXT,
  followup_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_messages_interview_id ON messages(interview_id);
CREATE INDEX IF NOT EXISTS idx_summaries_interview_id ON summaries(interview_id);
CREATE INDEX IF NOT EXISTS idx_messages_interview_skill ON messages(interview_id, skill_name);
CREATE INDEX IF NOT EXISTS idx_summaries_interview_skill ON summaries(interview_id, skill_name);
