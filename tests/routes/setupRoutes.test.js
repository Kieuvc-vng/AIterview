/**
 * Setup Routes Test Suite
 * Tests for: parse-jd, suggest-skills, suggest-questions, create-session
 */

const express = require('express');
const request = require('supertest');
const setupRoutes = require('../../src/routes/setupRoutes');

// Create test app
let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/setup', setupRoutes);

  // Error handler middleware
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  });
});

describe('Setup Routes', () => {
  describe('POST /api/setup/parse-jd', () => {
    test('should parse job description and extract fields', async () => {
      const jdText = `
        Job Title: Senior Software Engineer
        Company: Tech Corp
        Level: Senior
        Requirements: 5+ years experience in Node.js
      `;

      const response = await request(app)
        .post('/api/setup/parse-jd')
        .send({ jd_text: jdText });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('job_title');
      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('company');
    });

    test('should return 400 if jd_text is missing', async () => {
      const response = await request(app)
        .post('/api/setup/parse-jd')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should return 400 if jd_text is empty', async () => {
      const response = await request(app)
        .post('/api/setup/parse-jd')
        .send({ jd_text: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/setup/suggest-skills', () => {
    test('should suggest skills based on JD', async () => {
      const response = await request(app)
        .post('/api/setup/suggest-skills')
        .send({
          jd_text: 'Senior Node.js developer needed',
          job_title: 'Backend Engineer',
          level: 'Senior'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('skills');
      expect(Array.isArray(response.body.skills)).toBe(true);
      expect(response.body.skills.length).toBeGreaterThan(0);
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/setup/suggest-skills')
        .send({ jd_text: 'Some JD' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/setup/suggest-questions', () => {
    test('should generate questions for each skill', async () => {
      const response = await request(app)
        .post('/api/setup/suggest-questions')
        .send({
          jd_text: 'Backend developer role',
          skills: ['Node.js', 'Databases'],
          job_title: 'Backend Engineer',
          level: 'Mid'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('questions_by_skill');
      expect(typeof response.body.questions_by_skill).toBe('object');
    });

    test('should return 400 if skills array is empty', async () => {
      const response = await request(app)
        .post('/api/setup/suggest-questions')
        .send({
          jd_text: 'Backend developer role',
          skills: [],
          job_title: 'Backend Engineer',
          level: 'Mid'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/setup/create-session', () => {
    test('should create a new interview session', async () => {
      const response = await request(app)
        .post('/api/setup/create-session')
        .send({
          hr_email: 'hr@company.com',
          job_title: 'Backend Engineer',
          level: 'Mid',
          company: 'Tech Corp',
          skills: ['Node.js', 'SQL'],
          questions_by_skill: {
            'Node.js': ['Question 1', 'Question 2'],
            'SQL': ['Question 3']
          }
        });

      expect(response.status).toBe(200 || 201);
      expect(response.body).toHaveProperty('session_id');
      expect(response.body).toHaveProperty('interview_link');
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/setup/create-session')
        .send({
          hr_email: 'hr@company.com'
        });

      expect(response.status).toBe(400);
    });

    test('should return 400 if questions_by_skill is not an object', async () => {
      const response = await request(app)
        .post('/api/setup/create-session')
        .send({
          hr_email: 'hr@company.com',
          job_title: 'Engineer',
          level: 'Mid',
          company: 'Corp',
          skills: ['Skill1'],
          questions_by_skill: 'invalid'
        });

      expect(response.status).toBe(400);
    });
  });
});
