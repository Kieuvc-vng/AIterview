// tests/summaryGenerator.test.js
const summaryGenerator = require('../src/services/summaryGenerator');

describe('summaryGenerator', () => {
  test('generateSummary should return empty if no messages', async () => {
    const result = await summaryGenerator.generateSummary('int1', 'Python', 0, 'Python?', []);
    expect(result.main_answer_summary).toBe('');
    expect(result.followup_summary).toBe('');
  });

  test('generateSummary should filter relevant messages', async () => {
    const messages = [
      { skill_name: 'Python', question_index: 0, attempt_number: 1, content: '5 years' },
      { skill_name: 'SQL', question_index: 1, attempt_number: 1, content: 'SQL content' }
    ];
    const result = await summaryGenerator.generateSummary('int1', 'Python', 0, 'Python?', messages);
    expect(result).toBeDefined();
  });

  test('generateSummary should separate main answer from followups', async () => {
    const messages = [
      { skill_name: 'Python', question_index: 0, attempt_number: 1, content: 'Main answer' },
      { skill_name: 'Python', question_index: 0, attempt_number: 2, content: 'Follow-up 1' },
      { skill_name: 'Python', question_index: 0, attempt_number: 3, content: 'Follow-up 2' }
    ];
    const result = await summaryGenerator.generateSummary('int1', 'Python', 0, 'Python?', messages);
    expect(result).toHaveProperty('main_answer_summary');
    expect(result).toHaveProperty('followup_summary');
  });
});
