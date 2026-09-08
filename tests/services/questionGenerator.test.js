const { generateQuestions } = require('../../src/services/questionGenerator');

describe('Question Generator', () => {
  test('generateQuestions returns questions per skill', async () => {
    const skills = ['Problem Solving', 'Communication'];
    const result = await generateQuestions('Sample JD', skills, 'Engineer', 'Mid');
    expect(typeof result).toBe('object');
    expect(result['Problem Solving']).toBeDefined();
    expect(Array.isArray(result['Problem Solving'])).toBe(true);
  }, 15000);
});
