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

const generateSkillEvaluation = async (skill_name, skill_questions, candidate_messages) => {
  try {
    // Get all candidate messages (don't filter by skill_name as they may not be set)
    const candidateAnswers = candidate_messages.filter(m => m.sender === 'candidate');

    if (candidateAnswers.length === 0) {
      return '';
    }

    // Concatenate all candidate answers for evaluation
    const allAnswers = candidateAnswers.map(m => m.content).join('\n\n');

    // Build evaluation prompt
    const questionsText = skill_questions.join('\n- ');
    const systemPrompt = `Đánh giá kỹ năng "${skill_name}" dựa trên câu trả lời của ứng viên. Tóm tắt 2-3 dòng về:
- Điểm mạnh
- Điểm cần cải thiện
- Kết luận về mức độ

Ngắn gọn, trung thực, không quá lạc quan.`;

    const messages = [
      {
        role: 'user',
        content: `Kỹ năng: ${skill_name}\n\nCâu hỏi:\n- ${questionsText}\n\nCâu trả lời của ứng viên:\n${allAnswers}\n\nĐánh giá:`
      }
    ];

    const response = await callQwen(messages, systemPrompt);
    return response.trim();
  } catch (error) {
    console.error('Skill evaluation error:', error);
    return '';
  }
};

const saveSummary = (db, summary_id, interview_id, skill_name, question_index, question_text, main_summary, followup_summary) => {
  const stmt = db.prepare(`
    INSERT INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(summary_id, interview_id, skill_name, question_index, question_text, main_summary, followup_summary);
};

const saveSkillEvaluation = async (db, interview_id, skill_name, evaluation_text) => {
  const summary_id = 'summary_' + uuidv4();
  try {
    await db.run(
      `INSERT INTO summaries (id, interview_id, skill_name, question_index, question_text, main_answer_summary, followup_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [summary_id, interview_id, skill_name, 0, skill_name, evaluation_text, '']
    );
    console.log('[SummaryGenerator] Saved skill evaluation:', skill_name);
  } catch (error) {
    console.error('[SummaryGenerator] Error saving skill evaluation:', error);
  }
};

module.exports = {
  generateSummary,
  generateSkillEvaluation,
  summarizeText,
  saveSummary,
  saveSkillEvaluation
};
