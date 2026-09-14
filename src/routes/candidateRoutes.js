// src/routes/candidateRoutes.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const sessionManager = require('../services/sessionManager');

// GET /candidates/job/:job_id - List candidates for a job
router.get('/job/:job_id', (req, res) => {
  try {
    const candidates = sessionManager.getCandidatesByJob(req.params.job_id);
    res.json({ success: true, candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /candidates - Create new candidate
router.post('/', (req, res) => {
  try {
    const { job_id, name, email, phone } = req.body;

    if (!job_id || !name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const candidate_id = 'candidate_' + uuidv4();
    const candidate = {
      candidate_id,
      job_id,
      name,
      email,
      phone,
      created_at: new Date().toISOString()
    };

    sessionManager.saveCandidate(candidate);
    res.json({ success: true, candidate_id, message: 'Candidate created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /candidates/:candidate_id
router.get('/:candidate_id', (req, res) => {
  try {
    const candidate = sessionManager.getCandidate(req.params.candidate_id);
    if (!candidate) return res.status(404).json({ success: false, error: 'Candidate not found' });
    res.json({ success: true, candidate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
