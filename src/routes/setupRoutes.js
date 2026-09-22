const express = require('express');
const router = express.Router();

const { parseJD } = require('../services/jdParser');
const { suggestSkills } = require('../services/skillsSuggester');
const { generateQuestions } = require('../services/questionGenerator');
const jobLibraryService = require('../services/jobLibraryService');

/**
 * POST /api/setup/parse-jd
 * Parse job description and extract job title, level, company
 */
router.post('/parse-jd', async (req, res, next) => {
  try {
    const { jd_text } = req.body;

    if (!jd_text) {
      return res.status(400).json({ error: 'Missing required parameter: jd_text' });
    }

    const result = await parseJD(jd_text);
    res.json(result);
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/setup/suggest-skills
 * Suggest key skills for the position
 */
router.post('/suggest-skills', async (req, res, next) => {
  try {
    const { jd_text, job_title, level } = req.body;

    if (!jd_text || !job_title || !level) {
      return res.status(400).json({
        error: 'Missing required parameters: jd_text, job_title, level'
      });
    }

    const skills = await suggestSkills(jd_text, job_title, level);
    res.json({ skills });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/setup/suggest-questions
 * Generate interview questions for each skill
 */
router.post('/suggest-questions', async (req, res, next) => {
  try {
    const { jd_text, skills, job_title, level } = req.body;

    if (!jd_text || !skills || !job_title || !level) {
      return res.status(400).json({
        error: 'Missing required parameters: jd_text, skills, job_title, level'
      });
    }

    const result = await generateQuestions(jd_text, skills, job_title, level);
    // Flatten if needed
    let questions = result.questions_by_skill || result;
    if (questions && questions.questions_by_skill) {
      questions = questions.questions_by_skill;
    }
    res.json({ questions_by_skill: questions });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

/**
 * POST /api/setup/create-session
 * Create new job (interview session)
 */
router.post('/create-session', async (req, res, next) => {
  try {
    const { hr_email, job_title, level, company, skills, questions_by_skill, jd_text } = req.body;

    if (!hr_email || !job_title || !level || !company || !skills) {
      return res.status(400).json({
        error: 'Missing required parameters: hr_email, job_title, level, company, skills'
      });
    }

    const result = await jobLibraryService.createJob({
      hr_email,
      job_title,
      level,
      company,
      skills,
      questions_by_skill,
      jd_text
    });

    res.json({
      job_id: result.id,
      interview_link: `/interview.html?job_id=${result.id}`
    });
  } catch (error) {
    next({ status: 500, message: error.message });
  }
});

module.exports = router;
