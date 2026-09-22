/**
 * Unit test for Interview Engine Service
 * Tests state machine logic without database dependency
 */

const {
  initializeInterviewState,
  getCurrentQuestion,
  processAnswerQuality,
  isInterviewComplete,
  moveToNextSkillIfNeeded
} = require('./interviewEngine');

async function runTests() {
  try {
    console.log('=== Interview Engine Service Tests ===\n');

    // Test data
    const sessionData = {
      skills: [
        { name: 'Communication' },
        { name: 'Problem Solving' }
      ],
      questions_by_skill: {
        'Communication': ['How do you handle conflicts?', 'Describe your style'],
        'Problem Solving': ['Solve this...']
      }
    };

    // Test 1: Initialize interview state
    console.log('Test 1: initializeInterviewState');
    const initialState = initializeInterviewState(sessionData);
    console.log('✓ Initial state:', initialState);
    console.assert(initialState.skill_index === 0, 'Skill index should be 0');
    console.assert(initialState.question_index === 0, 'Question index should be 0');
    console.assert(initialState.attempt_count === 0, 'Attempt count should be 0');
    console.log();

    // Test 2: Get current question
    console.log('Test 2: getCurrentQuestion');
    const currentQ = getCurrentQuestion(initialState, sessionData);
    console.log('✓ Current question:', {
      question_text: currentQ.question_text,
      skill_name: currentQ.skill_name,
      attempt_number: currentQ.attempt_number
    });
    console.assert(currentQ.question_text === 'How do you handle conflicts?', 'Should get first question');
    console.assert(currentQ.skill_name === 'Communication', 'Should be Communication skill');
    console.log();

    // Test 3: Process good answer
    console.log('Test 3: processAnswerQuality (good answer)');
    const goodResponse = 'That is a good approach! [[ANSWER_GOOD]]';
    const afterGood = processAnswerQuality(initialState, goodResponse);
    console.log('✓ Good answer result:', {
      is_good_answer: afterGood.is_good_answer,
      next_action: afterGood.next_action,
      updated_state: afterGood.updated_state
    });
    console.assert(afterGood.is_good_answer === true, 'Should detect good answer');
    console.assert(afterGood.next_action === 'next_question', 'Should move to next question');
    console.assert(afterGood.updated_state.question_index === 1, 'Should increment question index');
    console.log();

    // Test 4: Process weak answer (attempt 1)
    console.log('Test 4: processAnswerQuality (weak answer)');
    const weakResponse = 'Your answer is vague. Can you elaborate?';
    const afterWeak = processAnswerQuality(initialState, weakResponse);
    console.log('✓ Weak answer result:', {
      is_good_answer: afterWeak.is_good_answer,
      next_action: afterWeak.next_action,
      updated_state: afterWeak.updated_state
    });
    console.assert(afterWeak.is_good_answer === false, 'Should not mark as good');
    console.assert(afterWeak.next_action === 'follow_up', 'Should ask follow-up');
    console.assert(afterWeak.updated_state.attempt_count === 1, 'Should increment attempt count');
    console.log();

    // Test 5: Process answer at max attempts
    console.log('Test 5: processAnswerQuality (max attempts)');
    const maxAttemptState = { skill_index: 0, question_index: 0, attempt_count: 2 };
    const maxAttemptResponse = 'Still not great but moving on';
    const afterMaxAttempt = processAnswerQuality(maxAttemptState, maxAttemptResponse);
    console.log('✓ Max attempt result:', {
      next_action: afterMaxAttempt.next_action,
      updated_state: afterMaxAttempt.updated_state
    });
    console.assert(afterMaxAttempt.next_action === 'next_question', 'Should move to next question at attempt 3');
    console.log();

    // Test 6: Check interview not complete
    console.log('Test 6: isInterviewComplete (not complete)');
    const notCompleteState = { skill_index: 0, question_index: 0, attempt_count: 0 };
    const isComplete1 = isInterviewComplete(notCompleteState, sessionData);
    console.log('✓ Interview complete:', isComplete1);
    console.assert(isComplete1 === false, 'Should not be complete at start');
    console.log();

    // Test 7: Check interview complete
    console.log('Test 7: isInterviewComplete (complete)');
    const completeState = { skill_index: 2, question_index: 0, attempt_count: 0 };
    const isComplete2 = isInterviewComplete(completeState, sessionData);
    console.log('✓ Interview complete:', isComplete2);
    console.assert(isComplete2 === true, 'Should be complete after all skills');
    console.log();

    // Test 8: Move to next skill
    console.log('Test 8: moveToNextSkillIfNeeded');
    const skillChangeState = { skill_index: 0, question_index: 2, attempt_count: 0 };
    const nextSkillState = moveToNextSkillIfNeeded(skillChangeState, sessionData);
    console.log('✓ After moving:', nextSkillState);
    console.assert(nextSkillState.skill_index === 1, 'Should move to next skill');
    console.assert(nextSkillState.question_index === 0, 'Should reset question index');
    console.log();

    console.log('=== All Interview Engine Tests Passed! ===');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
