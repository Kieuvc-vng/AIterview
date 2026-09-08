const { callQwen } = require('./qwenClient');

const parseJD = async (jdText) => {
  const systemPrompt = `You are an expert HR assistant. Extract job title, level, and company from the given job description.
Return ONLY a JSON object (no markdown, no explanation):
{ "job_title": "...", "level": "...", "company": "..." }
Levels must be one of: Junior, Mid, Senior`;

  const messages = [
    { role: 'user', content: `Extract fields from this JD:\n${jdText}` }
  ];

  try {
    const response = await callQwen(messages, systemPrompt);
    const parsed = JSON.parse(response);
    return {
      job_title: parsed.job_title || 'Unknown Position',
      level: ['Junior', 'Mid', 'Senior'].includes(parsed.level) ? parsed.level : 'Mid',
      company: parsed.company || 'Unknown Company'
    };
  } catch (error) {
    console.error('JD parsing error:', error);
    return {
      job_title: 'Position',
      level: 'Mid',
      company: 'Company'
    };
  }
};

module.exports = { parseJD };
