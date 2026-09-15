// src/services/summaryGenerator.js
const { callQwen } = require('./qwenClient');
const { v4: uuidv4 } = require('uuid');

const generateSummary = async (interview_id, skill_name, question_index, question_text, messages) => {
  try {
    // Filter messages for this question
    const relevantMessages = messages.filter(
      m => m.skill_name === skill_name && m.question_index === question_index
    );

    if (relevantMessages.length === 0) {
      return { main_answer_summary: '', followup_summary: '' };
    }

    // Separate main answer from follow-ups
    const mainAnswerMessages = relevantMessages.filter(m => m.attempt_number === 1);
    const followupMessages = relevantMessages.filter(m => m.attempt_number > 1);

    // Generate main answer summary
    let main_answer_summary = '';
    if (mainAnswerMessages.length > 0) {
      const mainContent = mainAnswerMessages.map(m => m.content).join('\n');
      main_answer_summary = await summarizeText(question_text, mainContent);
    }

    // Generate follow-up summary
    let followup_summary = '';
    if (followupMessages.length > 0) {
      const followupContent = followupMessages.map(m => m.content).join('\n');
      followup_summary = await summarizeText('Follow-up responses', followupContent);
    }

    return { main_answer_summary, followup_summary };
  } catch (error) {
    console.error('Summary generation error:', error);
    return { main_answer_summary: '', followup_summary: '' };
  }
};

const summarizeText = async (question, answer) => {
  const systemPrompt = `Tóm tắt câu trả lời thành 1-2 dòng. Tập trung vào kỹ năng chính. Ngắn gọn và trung thực.`;

  const messages = [
    {
      role: 'user',
      content: `Câu hỏi: ${question}\n\nCâu trả lời: ${answer}\n\nTóm tắt:`
    }
  ];

  const response = await callQwen(messages, systemPrompt);
  return response.trim();
};

const saveSummary = (db, summary_id, interview_id, skill_name, question_index, question_text, main_summary, followup_summary) => {
  const stmt = db.prepare(`
    INSERT INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(summary_id, interview_id, skill_name, question_index, question_text, main_summary, followup_summary);
};

const generateAllSummaries = async (interviewId, db) => {
  try {
    if (!db) {
      console.error('[SummaryGenerator] No database available');
      return [];
    }

    const messages = await db.prepare(
      'SELECT * FROM messages WHERE interview_id = ? ORDER BY created_at'
    ).all(interviewId);

    if (!messages || messages.length === 0) return [];

    const candidateMessages = messages.filter(m => m.sender === 'candidate');
    const aiMessages = messages.filter(m => m.sender === 'ai');

    const summaries = [];

    for (let i = 0; i < aiMessages.length; i++) {
      const question = aiMessages[i];
      const answerIndex = candidateMessages.findIndex(
        m => new Date(m.created_at) > new Date(question.created_at)
      );

      if (answerIndex === -1) continue;

      const answer = candidateMessages[answerIndex];
      const skillName = question.skill_name || 'General';
      const questionIndex = question.question_index || i;

      try {
        const { main_answer_summary, followup_summary } = await generateSummary(
          interviewId,
          skillName,
          questionIndex,
          question.content,
          [{ ...answer, skill_name: skillName, question_index: questionIndex, attempt_number: 1 }]
        );

        const summaryId = 'summary_' + uuidv4();
        await db.prepare(
          'INSERT OR REPLACE INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(summaryId, interviewId, skillName, questionIndex, question.content, main_answer_summary, followup_summary);

        summaries.push({ skill_name: skillName, question_index: questionIndex, main_answer_summary, followup_summary });
      } catch (err) {
        console.error(`[SummaryGenerator] Failed to summarize question ${i}:`, err.message);
      }
    }

    return summaries;
  } catch (error) {
    console.error('[SummaryGenerator] generateAllSummaries error:', error.message);
    return [];
  }
};

module.exports = {
  generateSummary,
  summarizeText,
  saveSummary,
  generateAllSummaries
};
