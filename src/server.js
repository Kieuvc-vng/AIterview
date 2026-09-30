// Require dotenv for .env loading
require('dotenv').config();

const express = require('express');
const path = require('path');

// Initialize database and start server
async function startServer() {
  let dbInitialized = false;

  // Initialize database on startup
  try {
    const dbModule = require('./db/init');
    await dbModule.getDb();
    dbInitialized = true;
    console.log('[Server] Database initialized successfully');
  } catch (error) {
    console.log('[Server] Database initialization failed, will use in-memory store:', error.message);
  }

  // Create Express app
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(express.json());

  // Health check endpoint for Dokploy
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', db: dbInitialized });
  });

  // Static files BEFORE routes
  app.use(express.static('public', { index: false }));

  // Redirect root to library
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/library.html'));
  });

  // Serve interview.html for /interview route
  app.get('/interview', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/interview.html'));
  });

  // Import route modules
  let setupRoutes, interviewRoutes, reviewRoutes, jobRoutes, candidateRoutes, jobLibraryRoutes;
  try {
    setupRoutes = require('./routes/setupRoutes');
    interviewRoutes = require('./routes/interviewRoutes');
    reviewRoutes = require('./routes/reviewRoutes');
    jobRoutes = require('./routes/jobRoutes');
    candidateRoutes = require('./routes/candidateRoutes');
    jobLibraryRoutes = require('./routes/jobLibraryRoutes');
    console.log('[Server] All route modules loaded successfully');
  } catch (error) {
    console.error('[Server] Failed to load route modules:', error.message);
    throw error;
  }

  // Use route modules
  app.use('/api/setup', setupRoutes);
  app.use('/api/interview', interviewRoutes);
  app.use('/api/review', reviewRoutes);
  app.use('/api/job-library', jobLibraryRoutes);
  app.use('/jobs', jobRoutes);
  app.use('/candidates', candidateRoutes);

  // Error handler middleware
  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });

  // Listen on PORT from env
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
