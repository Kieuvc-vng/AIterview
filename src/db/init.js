const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../interview.db');

// Create a wrapper that provides promise-based methods around sqlite3
class Database {
  constructor(filepath) {
    this.db = new sqlite3.Database(filepath, (err) => {
      if (err) {
        console.error('Database connection error:', err.message);
      }
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      // Ensure params is an array
      const paramsArray = Array.isArray(params) ? params : [params];
      this.db.run(sql, paramsArray, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      // Ensure params is an array
      const paramsArray = Array.isArray(params) ? params : [params];
      this.db.get(sql, paramsArray, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      // Ensure params is an array
      const paramsArray = Array.isArray(params) ? params : [params];
      this.db.all(sql, paramsArray, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  prepare(sql) {
    // Return a simple wrapper object for prepared statements
    // This allows code to call stmt.run(param1, param2, ...) synchronously
    // but returns promises that need to be awaited
    const self = this;
    return {
      run: function(...params) {
        return self.run(sql, params);
      },
      get: function(...params) {
        return self.get(sql, params);
      },
      all: function(...params) {
        return self.all(sql, params);
      }
    };
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

let db = null;
let initPromise = null;

async function initializeDatabase() {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      db = new Database(dbPath);

      // Enable foreign keys
      await db.run('PRAGMA foreign_keys = ON');

      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Split schema into individual statements and execute them
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          await db.run(stmt);
        }
      }

      // Apply migrations for existing databases
      try {
        // Add link_sent_at column to candidates table if it doesn't exist
        const tableInfo = await db.all("PRAGMA table_info(candidates)");
        const hasLinkSentAt = tableInfo.some(col => col.name === 'link_sent_at');
        if (!hasLinkSentAt) {
          await db.run('ALTER TABLE candidates ADD COLUMN link_sent_at TIMESTAMP');
          console.log('Migration: Added link_sent_at column to candidates table');
        }
      } catch (migrationError) {
        console.log('Migration check completed:', migrationError.message);
      }

      console.log('Database initialized:', dbPath);
      return db;
    } catch (error) {
      console.error('Database initialization error:', error.message);
      throw error;
    }
  })();

  return initPromise;
}

// Create proxy object that holds db reference once initialized
const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (!db) {
      throw new Error('Database not initialized yet. Use await getDb() instead.');
    }
    return db[prop];
  }
});

// Start initialization immediately
initializeDatabase().catch(error => {
  console.error('[Init] Database initialization failed:', error.message);
});

module.exports = {
  getDb: async () => {
    if (db) return db;
    return initializeDatabase();
  },
  db: dbProxy
};
