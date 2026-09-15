const request = require('supertest');
const express = require('express');

// Mock jobLibraryService
jest.mock('../src/services/jobLibraryService', () => ({
  getCandidateResults: jest.fn(),
  getCandidateById: jest.fn()
}));

const jobLibraryService = require('../src/services/jobLibraryService');
const jobLibraryRoutes = require('../src/routes/jobLibraryRoutes');

const app = express();
app.use(express.json());
app.use('/api/job-library', jobLibraryRoutes);

describe('GET /api/job-library/candidates/:candidateId/results', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns candidate results with summaries and messages', async () => {
    jobLibraryService.getCandidateResults.mockResolvedValue({
      candidate: { id: 'cand_1', name: 'Test', email: 'test@test.com', phone: '123', interview_status: 'completed', created_at: '2026-09-15' },
      interview: { id: 'int_1', status: 'completed' },
      summaries: [
        { skill_name: 'Python', question_index: 0, question_text: 'Python experience?', main_answer_summary: '5 years Python', followup_summary: '' }
      ],
      messages: [
        { sender: 'ai', content: 'Tell me about Python', created_at: '2026-09-15T10:00:00' },
        { sender: 'candidate', content: 'I have 5 years', created_at: '2026-09-15T10:01:00' }
      ]
    });

    const res = await request(app).get('/api/job-library/candidates/cand_1/results');
    expect(res.status).toBe(200);
    expect(res.body.candidate.name).toBe('Test');
    expect(res.body.summaries).toHaveLength(1);
    expect(res.body.messages).toHaveLength(2);
  });

  test('returns 404 if candidate not found', async () => {
    jobLibraryService.getCandidateResults.mockResolvedValue(null);
    const res = await request(app).get('/api/job-library/candidates/nonexistent/results');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/job-library/candidates/:candidateId/remind', () => {
  test('returns success with mock email message', async () => {
    jobLibraryService.getCandidateById.mockResolvedValue({
      id: 'cand_1', name: 'Test', email: 'test@test.com'
    });

    const res = await request(app).post('/api/job-library/candidates/cand_1/remind');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('test@test.com');
  });

  test('returns 404 if candidate not found', async () => {
    jobLibraryService.getCandidateById.mockResolvedValue(null);
    const res = await request(app).post('/api/job-library/candidates/nonexistent/remind');
    expect(res.status).toBe(404);
  });
});
