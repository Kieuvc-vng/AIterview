// src/db/migration.js
const sqlite3 = require('better-sqlite3');
const fs = require('fs');

const migrate = () => {
  const db = sqlite3(process.env.DATABASE_URL || './app.db');

  console.log('Starting migration...');

  try {
    // Begin transaction to ensure atomicity
    db.exec('BEGIN TRANSACTION');

    // Step 1: Backup old tables
    db.exec(`
      DROP TABLE IF EXISTS sessions_backup;
      DROP TABLE IF EXISTS rubrics_backup;
      CREATE TABLE sessions_backup AS SELECT * FROM sessions;
      CREATE TABLE rubrics_backup AS SELECT * FROM rubrics;
    `);
    console.log('✓ Backup created');

    // Step 2: Create new tables
    const schema = fs.readFileSync('src/db/schema.sql', 'utf8');
    db.exec(schema);
    console.log('✓ New schema created');

    // Step 3: Migrate SESSIONS → JOBS, CANDIDATES, INTERVIEWS
    // Use INSERT OR IGNORE for idempotency
    db.exec(`
      -- Create JOBS from unique (job_title, level, company) in sessions
      INSERT OR IGNORE INTO jobs (id, job_title, level, company, skills, questions_by_skill, hr_email, created_at)
      SELECT
        'job_' || lower(substr(hex(md5(job_title || '|' || level || '|' || company)), 1, 16)),
        job_title,
        level,
        company,
        skills,
        questions_by_skill,
        'migrated@app.com',
        CURRENT_TIMESTAMP
      FROM (
        SELECT DISTINCT job_title, level, company, skills, questions_by_skill
        FROM sessions_backup
      );

      -- Create CANDIDATES from sessions (one per unique candidate)
      -- Extract email from sessions_backup if available, otherwise use stable hash
      INSERT OR IGNORE INTO candidates (id, job_id, name, email, phone, created_at)
      SELECT
        'candidate_' || lower(substr(hex(md5(s.candidate_name || '|' || j.id)), 1, 16)),
        j.id,
        s.candidate_name,
        COALESCE(s.email, 'cand_' || lower(substr(hex(md5(s.candidate_name || '|' || j.id)), 1, 12)) || '@app.com'),
        COALESCE(s.phone, '+000000000'),
        s.created_at
      FROM sessions_backup s
      JOIN jobs j ON TRIM(s.job_title) = TRIM(j.job_title) AND TRIM(s.level) = TRIM(j.level) AND TRIM(s.company) = TRIM(j.company)
      GROUP BY s.candidate_name, j.id;

      -- Create INTERVIEWS from sessions (add FKs)
      INSERT OR IGNORE INTO interviews (id, job_id, candidate_id, status, created_at)
      SELECT
        s.session_id,
        j.id,
        c.id,
        s.status,
        s.created_at
      FROM sessions_backup s
      JOIN jobs j ON TRIM(s.job_title) = TRIM(j.job_title) AND TRIM(s.level) = TRIM(j.level) AND TRIM(s.company) = TRIM(j.company)
      JOIN candidates c ON j.id = c.job_id AND s.candidate_name = c.name;
    `);
    console.log('✓ SESSIONS migrated to JOBS, CANDIDATES, INTERVIEWS');

    // Step 4: Migrate MESSAGES (just update FK reference)
    console.log('✓ MESSAGES table ready for FK update via app code');

    // Step 5: Archive RUBRICS (don't delete, keep for audit)
    db.exec(`
      CREATE TABLE IF NOT EXISTS rubrics_archive AS SELECT * FROM rubrics_backup;
    `);
    console.log('✓ RUBRICS archived (kept for audit trail)');

    // Commit transaction
    db.exec('COMMIT');
    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    try {
      db.exec('ROLLBACK');
      console.log('✓ Database rolled back to previous state');
    } catch (rollbackError) {
      console.error('⚠️ Rollback failed:', rollbackError.message);
    }
    throw error;
  } finally {
    db.close();
  }
};

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
