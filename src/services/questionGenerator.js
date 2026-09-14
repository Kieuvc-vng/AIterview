const { callQwen } = require('./qwenClient');

const generateQuestions = async (jdText, skills, jobTitle, level) => {
  const systemPrompt = `You are an expert interview designer. Generate 2-4 thoughtful interview questions for evaluating each skill.
Return ONLY a JSON object where keys are skill names and values are arrays of questions (no markdown, no explanation):
{"Skill 1": ["Question 1", "Question 2", "Question 3"], "Skill 2": ["Question 1", "Question 2"]}`;

  const skillsStr = skills.join(', ');
  const messages = [
    { role: 'user', content: `Generate interview questions for a ${level} ${jobTitle}.
Skills to evaluate: ${skillsStr}
JD: ${jdText}` }
  ];

  try {
    const response = await callQwen(messages, systemPrompt);
    const parsed = JSON.parse(response);

    // Handle both formats: {questions_by_skill: {...}} and {...}
    if (parsed.questions_by_skill && typeof parsed.questions_by_skill === 'object') {
      return parsed.questions_by_skill;
    }
    return parsed;
  } catch (error) {
    console.error('Question generation error:', error);
    const fallback = {};
    skills.forEach(skill => {
      fallback[skill] = [
        `Tell me about your experience with ${skill}.`,
        `How do you apply ${skill} in your work?`
      ];
    });
    return fallback;
  }
};

module.exports = { generateQuestions };
