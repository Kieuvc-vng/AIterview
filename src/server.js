// Require dotenv for .env loading
require('dotenv').config();

// Initialize database on startup
// require('./db/init');

const express = require('express');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

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
