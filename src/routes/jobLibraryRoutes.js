const express = require('express');
const router = express.Router();
const jobLibraryService = require('../services/jobLibraryService');

// GET /api/job-library/jobs - List all jobs for HR
router.get('/jobs', async (req, res, next) => {
  try {
    const { hr_email } = req.query;
    if (!hr_email) {
      return res.status(400).json({ error: 'Missing hr_email' });
    }

    const jobs = await jobLibraryService.getJobs(hr_email);
    res.json(jobs);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// GET /api/job-library/jobs/:id - Get job details
router.get('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await jobLibraryService.getJobById(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const candidates = await jobLibraryService.getCandidatesByJobId(id);

    res.json({ job, candidates });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// DELETE /api/job-library/jobs/:id - Delete job
router.delete('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    // Check if job exists before deleting
    const job = await jobLibraryService.getJobById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await jobLibraryService.deleteJob(id);
    res.json({ success: true });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// POST /api/job-library/jobs/:id/candidates - Add candidate
router.post('/jobs/:id/candidates', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, email' });
    }

    const candidateId = await jobLibraryService.addCandidate(id, { name, phone, email });
    res.json({ candidate_id: candidateId });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// POST /api/job-library/candidates/:candidateId/generate-link - Generate interview link
router.post('/candidates/:candidateId/generate-link', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Missing jobId' });
    }

    const link = await jobLibraryService.generateInterviewLink(jobId, candidateId);
    res.json({ interview_link: link });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// DELETE /api/job-library/candidates/:candidateId - Delete candidate
router.delete('/candidates/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    // Validate ID format
    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }

    // Check if candidate exists before deleting
    const candidate = await jobLibraryService.getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    await jobLibraryService.deleteCandidate(candidateId);
    res.json({ success: true });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
