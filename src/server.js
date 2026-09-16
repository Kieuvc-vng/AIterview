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

  // Redirect root to library BEFORE static middleware
  app.get('/', (req, res) => {
    res.redirect('/library.html');
  });

  // Serve interview.html for /interview route
  app.get('/interview', (req, res) => {
    res.redirect(`/interview.html${req.url.substring(req.url.indexOf('?'))}`);
  });

  // Static files after redirect (don't serve index.html as default for /)
  app.use(express.static('public', { index: false }));

  // Import route modules
  const setupRoutes = require('./routes/setupRoutes');
  const interviewRoutes = require('./routes/interviewRoutes');
  const reviewRoutes = require('./routes/reviewRoutes');
  const jobRoutes = require('./routes/jobRoutes');
  const candidateRoutes = require('./routes/candidateRoutes');
  const jobLibraryRoutes = require('./routes/jobLibraryRoutes');

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
