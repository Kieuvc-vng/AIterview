const { callQwen } = require('./qwenClient');

/**
 * Generate rubric for all skills based on interview messages
 * @param {Array} messages - Array of messages from the interview
 * @param {Array} skills - Array of skill objects: { name: string, questions: [string] }
 * @returns {Promise<Array>} Array of rubric entries: { skill_name, score, evidence, strengths, weaknesses }
 */
const generateRubric = async (messages, skills) => {
  try {
    const rubrics = [];

    // Build chat history for context
    const chatHistory = messages
      .map((msg) => `${msg.sender === 'ai' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
      .join('\n');

    // Generate rubric for each skill
    for (const skill of skills) {
      const skillName = skill.name || skill;
      try {
        const rubric = await generateSkillRubric(skillName, chatHistory);
        rubrics.push(rubric);
      } catch (error) {
        console.error(`Error generating rubric for skill ${skillName}:`, error.message);
        // Use fallback rubric with default score
        rubrics.push(generateFallbackRubric(skillName));
      }
    }

    return rubrics;
  } catch (error) {
    console.error('Error generating rubric:', error.message);
    throw error;
  }
};

/**
 * Generate rubric for a single skill
 * @param {string} skillName - Name of the skill to evaluate
 * @param {string} chatHistory - Full chat history from interview
 * @returns {Promise<Object>} Rubric entry: { skill_name, score, evidence, strengths, weaknesses }
 */
const generateSkillRubric = async (skillName, chatHistory) => {
  try {
    const systemPrompt = `You are an expert HR evaluator assessing interview responses.
Your task: Evaluate the candidate's demonstrated proficiency in "${skillName}".

Scoring guidelines:
- 0-2: No demonstrated ability; lacks basic knowledge
- 3-4: Minimal understanding; significant gaps; needs development
- 5-6: Adequate understanding; meets basic expectations
- 7-8: Strong understanding; clear competence; good examples
- 9-10: Excellent understanding; expert-level demonstration; exceptional examples

You MUST respond with ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "score": <number 0-10>,
  "evidence": "<quote or summary of evidence from chat>",
  "strengths": ["<strength 1>", "<strength 2>", "..."],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "..."]
}`;

    const messages = [
      {
        role: 'user',
        content: `Based on this interview transcript, evaluate the candidate's "${skillName}" skill:

${chatHistory}

Provide JSON evaluation.`
      }
    ];

    const response = await callQwen(messages, systemPrompt);
    const parsed = JSON.parse(response);

    return {
      skill_name: skillName,
      score: Math.max(0, Math.min(10, parsed.score || 5)), // Clamp between 0-10
      evidence: parsed.evidence || 'See interview transcript',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : []
    };
  } catch (error) {
    console.error(`Error generating rubric for skill ${skillName}:`, error.message);
    throw error;
  }
};

/**
 * Generate fallback rubric with default values
 * @param {string} skillName - Name of the skill
 * @returns {Object} Default rubric entry
 */
const generateFallbackRubric = (skillName) => {
  return {
    skill_name: skillName,
    score: 5, // Default middle score
    evidence: 'Unable to generate detailed evaluation. Please review the chat history manually.',
    strengths: ['Candidate participated in the interview'],
    weaknesses: ['Could not automatically evaluate - manual review needed']
  };
};

/**
 * Generate rubric summary (for display purposes)
 * @param {Array} rubrics - Array of rubric entries
 * @returns {Object} Summary with average score and details
 */
const getRubricSummary = (rubrics) => {
  try {
    if (!rubrics || rubrics.length === 0) {
      return {
        average_score: 0,
        total_skills: 0,
        rubrics: []
      };
    }

    const totalScore = rubrics.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore = totalScore / rubrics.length;

    return {
      average_score: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      total_skills: rubrics.length,
      rubrics: rubrics.map((r) => ({
        skill_name: r.skill_name,
        score: r.score,
        evidence: r.evidence
      }))
    };
  } catch (error) {
    console.error('Error getting rubric summary:', error.message);
    throw error;
  }
};

module.exports = {
  generateRubric,
  generateSkillRubric,
  generateFallbackRubric,
  getRubricSummary
};
