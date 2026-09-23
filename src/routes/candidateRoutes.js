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
      id: candidate_id,
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

// PUT /candidates/:candidate_id/mark-sent - Mark interview link as sent
router.put('/:candidate_id/mark-sent', (req, res) => {
  try {
    const { candidate_id } = req.params;
    const candidate = sessionManager.getCandidate(candidate_id);

    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const now = new Date().toISOString();
    sessionManager.updateCandidateStatus(candidate_id, {
      link_sent: 1,
      link_sent_at: now
    });

    res.json({
      success: true,
      message: 'Link marked as sent',
      link_sent_at: now
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /candidates/:candidate_id/update-status - Update link_sent status
router.put('/:candidate_id/update-status', (req, res) => {
  try {
    const { candidate_id } = req.params;
    const { link_sent } = req.body;
    const linkSent = Number(link_sent);

    if (![0, 1].includes(linkSent)) {
      return res.status(400).json({ success: false, error: 'link_sent must be 0 or 1' });
    }

    const candidate = sessionManager.getCandidate(candidate_id);
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found' });
    }

    const now = new Date().toISOString();
    const updateData = { link_sent: linkSent };

    // Only update link_sent_at if marking as sent (linkSent = 1)
    if (linkSent === 1) {
      updateData.link_sent_at = now;
    }

    sessionManager.updateCandidateStatus(candidate_id, updateData);

    res.json({
      success: true,
      message: 'Status updated',
      link_sent: linkSent,
      link_sent_at: updateData.link_sent_at || candidate.link_sent_at
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
