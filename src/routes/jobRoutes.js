// src/routes/jobRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Assume sessionManager singleton imported
const sessionManager = require('../services/sessionManager');

// GET /jobs - List all jobs
router.get('/', (req, res) => {
  try {
    const jobs = sessionManager.getJobs();
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /jobs/:job_id - Get job detail
router.get('/:job_id', (req, res) => {
  try {
    const job = sessionManager.getJob(req.params.job_id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /jobs - Save job to library
router.post('/', (req, res) => {
  try {
    const { job_title, level, company, description, skills, questions_by_skill, created_by } = req.body;

    if (!job_title || !level || !company || !skills || !questions_by_skill) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const job_id = 'job_' + uuidv4();
    const job = {
      job_id,
      job_title,
      level,
      company,
      description: description || '',
      skills: JSON.stringify(skills),
      questions_by_skill: JSON.stringify(questions_by_skill),
      created_by: created_by || 'unknown@app.com',
      created_at: new Date().toISOString()
    };

    sessionManager.saveJob(job);
    res.json({ success: true, job_id, message: 'Job saved to library' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /jobs/:job_id - Update job
router.put('/:job_id', (req, res) => {
  try {
    const job_id = req.params.job_id;
    const updates = req.body;

    sessionManager.updateJob(job_id, updates);
    res.json({ success: true, message: 'Job updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /jobs/:job_id - Delete job
router.delete('/:job_id', (req, res) => {
  try {
    sessionManager.deleteJob(req.params.job_id);
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
