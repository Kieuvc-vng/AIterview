/**
 * Interview Engine Service
 * Manages the state machine for interview flow:
 * - Tracks current skill and question
 * - Manages attempt count for each question (max 3)
 * - Determines when to move to next question/skill
 * - Detects when interview is complete
 */

/**
 * Initialize interview state
 * @param {Object} sessionData - Session data containing skills and questions_by_skill
 * @returns {Object} Initial interview state: { skill_index, question_index, attempt_count }
 */
const initializeInterviewState = (sessionData) => {
  try {
    // Get the ordered list of skills
    const skills = sessionData.skills || [];
    if (skills.length === 0) {
      throw new Error('No skills found in session');
    }

    return {
      skill_index: 0,
      question_index: 0,
      attempt_count: 0
    };
  } catch (error) {
    console.error('Error initializing interview state:', error.message);
    throw error;
  }
};

/**
 * Get the current question text
 * @param {Object} interviewState - Current interview state
 * @param {Object} sessionData - Session data with questions_by_skill
 * @returns {Object} { question_text, skill_name, attempt_number, total_attempts }
 */
const getCurrentQuestion = (interviewState, sessionData) => {
  try {
    const { skill_index, question_index, attempt_count } = interviewState;
    const questionsBySkill = sessionData.questions_by_skill;

    // Get ordered skill names
    const skills = sessionData.skills || [];
    if (skill_index >= skills.length) {
      throw new Error('Interview is complete');
    }

    const currentSkill = skills[skill_index];
    const skillName = currentSkill.name || currentSkill;

    // Get questions for this skill
    const questionsForSkill = questionsBySkill[skillName] || [];
    if (question_index >= questionsForSkill.length) {
      throw new Error(`Invalid question index for skill: ${skillName}`);
    }

    const questionText = questionsForSkill[question_index];

    return {
      question_text: questionText,
      skill_name: skillName,
      attempt_number: attempt_count + 1, // 1-indexed for display
      total_attempts: 3,
      skill_index,
      question_index
    };
  } catch (error) {
    console.error('Error getting current question:', error.message);
    throw error;
  }
};

/**
 * Process the quality of an answer
 * Checks for [[ANSWER_GOOD]] marker in AI response
 * @param {Object} interviewState - Current interview state
 * @param {string} aiResponse - AI response text
 * @returns {Object} { is_good_answer, updated_state, next_action }
 *   next_action: 'follow_up' | 'next_question' | 'end_interview'
 */
const processAnswerQuality = (interviewState, aiResponse) => {
  try {
    const isGoodAnswer = aiResponse.includes('[[ANSWER_GOOD]]');
    let updatedState = { ...interviewState };
    let nextAction = 'follow_up';

    // Increment attempt count
    updatedState.attempt_count += 1;

    if (isGoodAnswer || updatedState.attempt_count >= 3) {
      // Move to next question
      updatedState.question_index += 1;
      updatedState.attempt_count = 0;
      nextAction = 'next_question';
    } else {
      // Ask follow-up
      nextAction = 'follow_up';
    }

    return {
      is_good_answer: isGoodAnswer,
      updated_state: updatedState,
      next_action: nextAction
    };
  } catch (error) {
    console.error('Error processing answer quality:', error.message);
    throw error;
  }
};

/**
 * Check if interview is complete
 * @param {Object} interviewState - Current interview state
 * @param {Object} sessionData - Session data with skills and questions
 * @returns {boolean} True if interview is complete
 */
const isInterviewComplete = (interviewState, sessionData) => {
  try {
    const { skill_index, question_index } = interviewState;
    const skills = sessionData.skills || [];
    const questionsBySkill = sessionData.questions_by_skill;

    // Check if we've gone through all skills
    if (skill_index >= skills.length) {
      return true;
    }

    // Check if current skill is the last one and we've answered all questions
    if (skill_index === skills.length - 1) {
      const lastSkillName = skills[skill_index].name || skills[skill_index];
      const lastSkillQuestions = questionsBySkill[lastSkillName] || [];
      if (question_index >= lastSkillQuestions.length) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking interview completion:', error.message);
    throw error;
  }
};

/**
 * Move to next skill if current skill is complete
 * @param {Object} interviewState - Current interview state
 * @param {Object} sessionData - Session data
 * @returns {Object} Updated state
 */
const moveToNextSkillIfNeeded = (interviewState, sessionData) => {
  try {
    const { skill_index, question_index } = interviewState;
    const skills = sessionData.skills || [];
    const questionsBySkill = sessionData.questions_by_skill;

    if (skill_index >= skills.length) {
      return interviewState;
    }

    const currentSkill = skills[skill_index];
    const skillName = currentSkill.name || currentSkill;
    const questionsForSkill = questionsBySkill[skillName] || [];

    // If we've answered all questions for this skill, move to next skill
    if (question_index >= questionsForSkill.length) {
      return {
        ...interviewState,
        skill_index: skill_index + 1,
        question_index: 0,
        attempt_count: 0
      };
    }

    return interviewState;
  } catch (error) {
    console.error('Error moving to next skill:', error.message);
    throw error;
  }
};

module.exports = {
  initializeInterviewState,
  getCurrentQuestion,
  processAnswerQuality,
  isInterviewComplete,
  moveToNextSkillIfNeeded
};
