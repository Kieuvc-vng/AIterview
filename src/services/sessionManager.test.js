/**
 * Basic test for Session Manager Service
 * Tests: createNewSession, getSessionData, startInterview, endInterview, saveMessage, etc.
 */

const {
  createNewSession,
  getSessionData,
  startInterview,
  endInterview,
  saveMessage,
  getSessionMessages,
  addSkillRubric,
  getSessionRubric
} = require('./sessionManager');

// Test data
const testSkills = [
  { name: 'Communication', questions: ['How do you handle conflicts?', 'Describe your communication style'] },
  { name: 'Problem Solving', questions: ['Solve this problem...'] }
];

const testQuestionsBySkill = {
  'Communication': ['How do you handle conflicts?', 'Describe your communication style'],
  'Problem Solving': ['Solve this problem...']
};

async function runTests() {
  try {
    console.log('=== Session Manager Service Tests ===\n');

    // Test 1: Create new session
    console.log('Test 1: createNewSession');
    const sessionResult = createNewSession(
      'hr@company.com',
      'Software Engineer',
      'Mid',
      'TechCorp',
      testSkills,
      testQuestionsBySkill
    );
    console.log('✓ Session created:', {
      session_id: sessionResult.session_id,
      interview_link: sessionResult.interview_link
    });
    const sessionId = sessionResult.session_id;
    console.log();

    // Test 2: Get session data
    console.log('Test 2: getSessionData');
    const sessionData = getSessionData(sessionId);
    console.log('✓ Session data retrieved:', {
      job_title: sessionData.job_title,
      level: sessionData.level,
      status: sessionData.status
    });
    console.log();

    // Test 3: Start interview
    console.log('Test 3: startInterview');
    const startedSession = startInterview(sessionId, 'John Doe');
    console.log('✓ Interview started:', {
      candidate_name: startedSession.candidate_name,
      status: startedSession.status
    });
    console.log();

    // Test 4: Save message (AI)
    console.log('Test 4: saveMessage (AI)');
    const aiMsg = saveMessage(sessionId, 'ai', 'Hello, let\'s start the interview', 'Communication', 0, 0);
    console.log('✓ AI message saved:', {
      message_id: aiMsg.message_id,
      sender: aiMsg.sender
    });
    console.log();

    // Test 5: Save message (Candidate)
    console.log('Test 5: saveMessage (Candidate)');
    const candMsg = saveMessage(sessionId, 'candidate', 'I handle conflicts by communicating openly', 'Communication', 0, 1);
    console.log('✓ Candidate message saved:', {
      message_id: candMsg.message_id,
      sender: candMsg.sender
    });
    console.log();

    // Test 6: Get session messages
    console.log('Test 6: getSessionMessages');
    const messages = getSessionMessages(sessionId);
    console.log('✓ Messages retrieved:', messages.length, 'messages');
    console.log();

    // Test 7: Add skill rubric
    console.log('Test 7: addSkillRubric');
    const rubric = addSkillRubric(
      sessionId,
      'Communication',
      8,
      'Candidate clearly explained communication approach',
      ['Clear articulation', 'Good examples'],
      ['Could elaborate more']
    );
    console.log('✓ Rubric added:', {
      skill_name: rubric.skill_name,
      score: rubric.score
    });
    console.log();

    // Test 8: Get session rubric
    console.log('Test 8: getSessionRubric');
    const rubrics = getSessionRubric(sessionId);
    console.log('✓ Rubrics retrieved:', rubrics.length, 'rubric(s)');
    console.log();

    // Test 9: End interview
    console.log('Test 9: endInterview');
    const endedSession = endInterview(sessionId);
    console.log('✓ Interview ended:', {
      status: endedSession.status,
      completed_at: endedSession.completed_at ? 'set' : 'not set'
    });
    console.log();

    console.log('=== All Session Manager Tests Passed! ===');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
