const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const sessionManager = require('../services/sessionManager');
const { generateRubric, getRubricSummary } = require('../services/rubricGenerator');
const { generatePDF, generateCSV, cleanupOldExports } = require('../services/exportService');

/**
 * GET /api/review/:interviewId
 * Get interview messages and rubric from database
 */
router.get('/:interviewId', async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const db = require('../db/init').db;

    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Get interview info
    const interview = await db.get('SELECT * FROM interviews WHERE id = ?', [interviewId]);
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Get messages for this interview
    const messages = await db.all('SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at ASC', [interviewId]);

    // Get job for skills info
    const jobLibraryService = require('../services/jobLibraryService');
    const job = await jobLibraryService.getJobById(interview.job_id);
    const skills = job ? (typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills) : [];

    let rubric = [];

    try {
      // Get all summaries with rubric data for this interview
      const summaries = await db.all(
        'SELECT skill_name, rubric_score, rubric_evidence, rubric_strengths, rubric_weaknesses FROM summaries WHERE interview_id = ? AND rubric_score IS NOT NULL',
        [interviewId]
      );

        if (summaries && summaries.length > 0) {
          rubric = summaries.map(s => ({
            skill_name: s.skill_name,
            evidence: s.rubric_evidence,
            strengths: s.rubric_strengths ? JSON.parse(s.rubric_strengths) : [],
            weaknesses: s.rubric_weaknesses ? JSON.parse(s.rubric_weaknesses) : []
          }));
        } else {
          // Fallback to mock if no rubric exists
          rubric = skills.map((skill) => ({
            skill_name: skill,
            evidence: 'Rubric generation in progress or not yet completed',
            strengths: ['Pending rubric evaluation'],
            weaknesses: ['Pending rubric evaluation']
          }));
        }
      } catch (dbError) {
        console.error('[Review] Error fetching rubric:', dbError.message);
        // Use fallback if DB error
        rubric = skills.map((skill) => ({
          skill_name: skill,
          score: 5,
          evidence: 'Unable to fetch rubric',
          strengths: ['Error loading rubric'],
          weaknesses: ['Error loading rubric']
        }));
      }
    }

    // Get candidate info for response
    const candidate = await db.get('SELECT * FROM candidates WHERE id = ?', [interview.candidate_id]);

    res.json({
      session: {
        session_id: interviewId,
        candidate_name: candidate?.name || 'Unknown',
        job_title: job?.job_title || 'Unknown',
        level: job?.level || 'Unknown',
        company: job?.company || 'Unknown',
        status: interview.status,
        created_at: interview.created_at
      },
      messages,
      rubric
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/review/:sessionId/export
 * Export PDF or CSV of interview results
 */
router.post('/:sessionId/export', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { format } = req.body;

    if (!format || !['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Use pdf or csv.' });
    }

    // Try to get session data
    let session, messages = [];
    try {
      const data = await sessionManager.getSession(sessionId);
      if (data) {
        session = data.session;
        messages = data.messages || [];
      }
    } catch (dbError) {
      console.log('Database unavailable, using fallback data');
    }

    // Use fallback data if session not found
    if (!session) {
      session = {
        session_id: sessionId,
        candidate_name: 'Candidate',
        job_title: 'Position',
        level: 'Mid',
        company: 'Company',
        status: 'completed',
        created_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        skills: ['Communication', 'Technical Skills']
      };
    }

    const skills = typeof session.skills === 'string' ? JSON.parse(session.skills) : (session.skills || []);

    // Fetch rubric from database
    let rubric = [];
    if (db) {
      try {
        const summaries = await db.all(
          'SELECT skill_name, rubric_score, rubric_evidence, rubric_strengths, rubric_weaknesses FROM summaries WHERE interview_id = ? AND rubric_score IS NOT NULL',
          [sessionId]
        );

        if (summaries && summaries.length > 0) {
          rubric = summaries.map(s => ({
            skill_name: s.skill_name,
            evidence: s.rubric_evidence,
            strengths: s.rubric_strengths ? JSON.parse(s.rubric_strengths) : [],
            weaknesses: s.rubric_weaknesses ? JSON.parse(s.rubric_weaknesses) : []
          }));
        } else {
          // Fallback to mock
          rubric = skills.map((skill) => ({
            skill_name: skill,
            evidence: 'Rubric not yet generated',
            strengths: [],
            weaknesses: []
          }));
        }
      } catch (dbError) {
        console.error('[Export] Error fetching rubric:', dbError.message);
        rubric = skills.map((skill) => ({
          skill_name: skill,
          evidence: 'Unable to fetch rubric',
          strengths: [],
          weaknesses: []
        }));
      }
    } else {
      rubric = skills.map((skill) => ({
        skill_name: skill,
        evidence: 'Database unavailable',
        strengths: [],
        weaknesses: []
      }));
    }

    let filePath;
    if (format === 'pdf') {
      filePath = await generatePDF(messages, rubric, session);
    } else if (format === 'csv') {
      filePath = await generateCSV(rubric, session);
    }

    res.download(filePath, path.basename(filePath), (err) => {
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('Download error:', err);
      }
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('File cleanup error:', err);
        });
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
