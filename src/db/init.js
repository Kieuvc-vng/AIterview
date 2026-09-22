const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../interview.db');
let db = null;

async function getDb() {
  if (!db) {
    try {
      db = new Database(dbPath);
      db.pragma('foreign_keys = ON');

      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      db.exec(schema);

      console.log('Database initialized:', dbPath);
    } catch (error) {
      console.error('Database initialization error:', error.message);
      throw error;
    }
  }
  return db;
}

// Initialize on first load
getDb().catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = { getDb };
