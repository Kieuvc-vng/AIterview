const { parseJD } = require('../../src/services/jdParser');

describe('JD Parser', () => {
  test('parseJD extracts title, level, company', async () => {
    const jd = `Senior Backend Engineer - Vietnam
      We're looking for a Senior Backend Engineer with 5+ years experience.
      Company: VNG Games`;
    const result = await parseJD(jd);
    expect(result).toHaveProperty('job_title');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('company');
    expect(['Junior', 'Mid', 'Senior']).toContain(result.level);
  }, 15000);
});
