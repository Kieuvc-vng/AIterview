const { suggestSkills } = require('../../src/services/skillsSuggester');

describe('Skills Suggester', () => {
  test('suggestSkills returns 1-5 skills', async () => {
    const jd = 'Senior Backend Engineer with Node.js and database experience';
    const result = await suggestSkills(jd, 'Backend Engineer', 'Senior');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(5);
  }, 15000);
});
