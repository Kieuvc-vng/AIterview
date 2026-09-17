const express = require('express');
const router = express.Router();
const jobLibraryService = require('../services/jobLibraryService');
const { generateSummaryPDF, generateFullChatPDF, generateSummaryCSV, generateFullChatCSV } = require('../services/exportService');
const { generateAllSummaries } = require('../services/summaryGenerator');

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

// PUT /api/job-library/jobs/:id - Update job details
router.put('/jobs/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { job_title, level, company, skills, questions_by_skill, jd_text } = req.body;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    if (!job_title || !level || !company) {
      return res.status(400).json({
        error: 'Missing required fields: job_title, level, company'
      });
    }

    // Verify job exists
    const job = await jobLibraryService.getJobById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job using service
    await jobLibraryService.updateJob(id, {
      job_title,
      level,
      company,
      skills: skills || [],
      questions_by_skill: questions_by_skill || {},
      jd_text: jd_text || ''
    });

    res.json({ success: true, job_id: id });
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

// GET /api/job-library/candidates/:candidateId/results - Get interview results
router.get('/candidates/:candidateId/results', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const results = await jobLibraryService.getCandidateResults(candidateId);

    if (!results) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(results);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// POST /api/job-library/candidates/:candidateId/generate-summaries - Generate summaries on demand
router.post('/candidates/:candidateId/generate-summaries', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const results = await jobLibraryService.getCandidateResults(candidateId);

    if (!results) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    if (!results.interview) {
      return res.status(400).json({ error: 'No interview exists for this candidate' });
    }

    const dbModule = require('../db/init');
    const db = await dbModule.getDb();

    const summaries = await generateAllSummaries(results.interview.id, db);

    res.json({ success: true, summaries });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// POST /api/job-library/candidates/:candidateId/remind - Mock send reminder
router.post('/candidates/:candidateId/remind', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const candidate = await jobLibraryService.getCandidateById(candidateId);

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const now = new Date().toISOString();
    await jobLibraryService.updateCandidateRemindedAt(candidateId, now);

    res.json({
      success: true,
      message: `Đã gửi nhắc nhở đến ${candidate.email}`,
      reminded_at: now
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

// POST /api/job-library/candidates/:candidateId/export
router.post('/candidates/:candidateId/export', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { format, content } = req.body;

    if (!format || !content) {
      return res.status(400).json({ error: 'Missing format or content parameter' });
    }

    const results = await jobLibraryService.getCandidateResults(candidateId);
    if (!results) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const jobId = results.candidate.job_id;
    let jobTitle = 'Unknown Position';
    const job = await jobLibraryService.getJobById(jobId);
    if (job) jobTitle = job.job_title;

    let filePath;
    let fileName;

    if (content === 'summary' && format === 'pdf') {
      filePath = await generateSummaryPDF(results.candidate, results.summaries, jobTitle);
      fileName = `tom-tat_${results.candidate.name}.pdf`;
    } else if (content === 'summary' && format === 'csv') {
      filePath = await generateSummaryCSV(results.candidate, results.summaries, jobTitle);
      fileName = `tom-tat_${results.candidate.name}.csv`;
    } else if (content === 'full' && format === 'pdf') {
      filePath = await generateFullChatPDF(results.candidate, results.messages, jobTitle);
      fileName = `full-chat_${results.candidate.name}.pdf`;
    } else if (content === 'full' && format === 'csv') {
      filePath = await generateFullChatCSV(results.candidate, results.messages, jobTitle);
      fileName = `full-chat_${results.candidate.name}.csv`;
    } else {
      return res.status(400).json({ error: 'Invalid format/content combination' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
