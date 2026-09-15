const { generateSummaryPDF, generateSummaryCSV, generateFullChatPDF, generateFullChatCSV } = require('../src/services/exportService');
const fs = require('fs');

const mockCandidate = { id: 'cand_1', name: 'Nguyen Van A', email: 'a@test.com', phone: '0901234567' };
const mockSummaries = [
  { skill_name: 'Python', question_index: 0, question_text: 'Python experience?', main_answer_summary: '5 years with Django and Flask', followup_summary: '' },
  { skill_name: 'SQL', question_index: 0, question_text: 'SQL knowledge?', main_answer_summary: 'Strong PostgreSQL skills', followup_summary: 'Also familiar with MongoDB' }
];
const mockMessages = [
  { sender: 'ai', content: 'Tell me about Python', created_at: '2026-09-15T10:00:00' },
  { sender: 'candidate', content: 'I have 5 years with Django', created_at: '2026-09-15T10:01:00' }
];
const mockJobTitle = 'Backend Developer';

describe('Export Service - Summary PDF', () => {
  test('generates PDF file', async () => {
    const filePath = await generateSummaryPDF(mockCandidate, mockSummaries, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    fs.unlinkSync(filePath);
  });
});

describe('Export Service - Summary CSV', () => {
  test('generates CSV file', async () => {
    const filePath = await generateSummaryCSV(mockCandidate, mockSummaries, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('Python');
    fs.unlinkSync(filePath);
  });
});

describe('Export Service - Full Chat PDF', () => {
  test('generates PDF file with messages', async () => {
    const filePath = await generateFullChatPDF(mockCandidate, mockMessages, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    fs.unlinkSync(filePath);
  });
});

describe('Export Service - Full Chat CSV', () => {
  test('generates CSV file with messages', async () => {
    const filePath = await generateFullChatCSV(mockCandidate, mockMessages, mockJobTitle);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('candidate');
    fs.unlinkSync(filePath);
  });
});
