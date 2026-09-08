const { callQwen } = require('./qwenClient');

const suggestSkills = async (jdText, jobTitle, level) => {
  const systemPrompt = `You are an expert HR consultant. Suggest 1-5 key skills to evaluate candidates for a job.
Return ONLY a JSON array of skill names (no markdown, no explanation):
["skill1", "skill2", "skill3"]`;

  const messages = [
    { role: 'user', content: `For a ${level} ${jobTitle} position, suggest key skills to evaluate based on this JD:\n${jdText}` }
  ];

  try {
    const response = await callQwen(messages, systemPrompt);
    const skills = JSON.parse(response);
    return Array.isArray(skills) ? skills.slice(0, 5) : ['Technical Skills', 'Communication'];
  } catch (error) {
    console.error('Skills suggestion error:', error);
    return ['Technical Skills', 'Communication', 'Problem Solving'];
  }
};

module.exports = { suggestSkills };
