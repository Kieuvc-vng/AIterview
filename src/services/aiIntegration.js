const { callQwen } = require('./qwenClient');

/**
 * Conduct interview - AI evaluates candidate answer
 * @param {string} currentQuestion - The question that was asked
 * @param {Array} previousMessages - Previous message history (messages array)
 * @param {string} candidateName - Candidate's name
 * @param {string} jobTitle - Job title
 * @param {string} level - Level (Junior/Mid/Senior)
 * @param {string} skillName - Skill being evaluated (optional)
 * @param {number} attemptNumber - Current attempt number (optional, default: 1)
 * @returns {Promise<Object>} { ai_response, answer_good }
 */
const conductInterview = async (
  currentQuestion,
  previousMessages,
  candidateName,
  jobTitle,
  level,
  skillName = 'Unknown',
  attemptNumber = 1
) => {
  try {
    const systemPrompt = `You are an experienced HR interviewer conducting a professional interview.

Interview Context:
- Position: ${jobTitle} (${level} Level)
- Candidate Name: ${candidateName}
- Current Skill: ${skillName}
- Attempt Number: ${attemptNumber}/3

Instructions:
1. Evaluate the candidate's answer naturally, as if in a real conversation.
2. Use the candidate's name (${candidateName}) to create a friendly tone.
3. Assess the answer quality:
   - Does it answer the question with sufficient detail?
   - Is it comprehensive and well-structured?
   - Does it demonstrate understanding of the skill?
4. If the answer is good:
   - Provide positive feedback.
   - End your response with: [[ANSWER_GOOD]]
5. If the answer is weak AND attempt < 3:
   - Ask ONE follow-up question to probe deeper.
   - Be encouraging and specific.
   - Do NOT use the [[ANSWER_GOOD]] marker.
6. If attempt = 3:
   - Thank the candidate for their answer.
   - Acknowledge the effort.
   - Do NOT mark as good, and do NOT ask follow-ups.
   - Do NOT use the [[ANSWER_GOOD]] marker.

Keep your response natural and conversational.`;

    // Call Qwen with the conversation history
    const response = await callQwen(previousMessages, systemPrompt);

    // Parse response for [[ANSWER_GOOD]] marker
    const answerGood = response.includes('[[ANSWER_GOOD]]');

    // Remove marker from response before returning
    const cleanedResponse = response.replace(/\[\[ANSWER_GOOD\]\]/g, '').trim();

    return {
      ai_response: cleanedResponse,
      answer_good: answerGood
    };
  } catch (error) {
    console.error('AI Integration error:', error.message);
    throw new Error(`AI evaluation failed: ${error.message}`);
  }
};

/**
 * Generate opening greeting for interview
 * @param {string} candidateName - Candidate's name
 * @param {string} jobTitle - Job title
 * @param {string} firstQuestion - First question to ask
 * @returns {Promise<string>} AI's opening message
 */
const generateOpeningGreeting = async (candidateName, jobTitle, firstQuestion) => {
  try {
    const systemPrompt = `You are an experienced HR interviewer starting an interview with a candidate.
Create a warm, professional opening greeting that:
1. Welcomes the candidate by name: ${candidateName}
2. Mentions the position: ${jobTitle}
3. Transitions naturally into asking the first question
Keep it concise (2-3 sentences).`;

    const messages = [
      {
        role: 'user',
        content: `Start the interview with this first question: "${firstQuestion}"`
      }
    ];

    const response = await callQwen(messages, systemPrompt);
    return response;
  } catch (error) {
    console.error('Error generating opening greeting:', error.message);
    throw error;
  }
};

module.exports = {
  conductInterview,
  generateOpeningGreeting
};
