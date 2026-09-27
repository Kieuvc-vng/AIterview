// src/services/qwenClient.js
const axios = require('axios');

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen/qwen3.7-plus';
const QWEN_API_BASE_URL = process.env.QWEN_API_BASE_URL || 'https://maas-lle-aiplatform-hcm.api.vngcloud.vn/v2';
const QWEN_API_URL = `${QWEN_API_BASE_URL}/chat/completions`;

const isPlaceholderKey = () => {
  const result = !QWEN_API_KEY || QWEN_API_KEY.includes('your_') || QWEN_API_KEY.includes('placeholder');
  console.log('[qwenClient] isPlaceholderKey:', result, 'QWEN_API_KEY:', QWEN_API_KEY ? QWEN_API_KEY.substring(0, 20) + '...' : 'undefined');
  return result;
};

const getMockResponse = (systemPrompt, messages) => {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const systemLower = systemPrompt?.toLowerCase() || '';

  if (systemLower.includes('extract job title') || systemLower.includes('job title')) {
    // Try to extract job title, level, and company from JD text
    let job_title = 'Unknown Position';
    let level = 'Mid';
    let company = 'Unknown Company';

    // Extract from structured lines
    const companyMatch = lastMessage.match(/Company:\s*([^\n]+)/i);
    if (companyMatch) {
      company = companyMatch[1].trim();
    }

    const jobTitleMatch = lastMessage.match(/Job\s+Title:\s*([^\n]+)/i);
    if (jobTitleMatch) {
      job_title = jobTitleMatch[1].trim();
    }

    // Extract job title from "vai trò" or "position" or "role"
    const titleMatch = lastMessage.match(/(?:vai trò|position|title|role)[\s:]+([A-Z][^,\n.]+?)(?:[,.\n]|$)/i);
    if (titleMatch) {
      job_title = titleMatch[1].trim();
    } else {
      // Fallback: look for title keywords
      const titleKeywordMatch = lastMessage.match(/(?:Senior\s+)?(?:Marketing|Data|Software|Product|Business|Project|Sales|HR)\s+(?:Executive|Engineer|Developer|Manager|Lead|Specialist)[^\n,.]*/i);
      if (titleKeywordMatch) {
        job_title = titleKeywordMatch[0].trim();
      }
    }

    // Determine level based on keywords
    if (/(?:senior|lead|principal|manager)/i.test(lastMessage)) {
      level = 'Senior';
    } else if (/(?:junior|entry|intern|fresher)/i.test(lastMessage)) {
      level = 'Junior';
    }

    return JSON.stringify({
      job_title,
      level,
      company
    });
  }
  if (systemLower.includes('suggest') && systemLower.includes('skill')) {
    // Extract skills from JD content by looking for keywords
    const jdLower = lastMessage.toLowerCase();

    // Define skill keywords to search for
    const skillKeywords = {
      // Technical
      'python': 'Python',
      'javascript': 'JavaScript',
      'react': 'React',
      'sql': 'SQL',
      'database': 'Database Design',
      'data pipelines': 'Data Pipelines',
      'apache spark': 'Apache Spark',
      'aws': 'AWS',
      'cloud': 'Cloud Architecture',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'git': 'Git',
      'devops': 'DevOps',
      'system design': 'System Design',
      'api': 'API Design',
      'rest': 'REST APIs',
      'graphql': 'GraphQL',
      'machine learning': 'Machine Learning',
      'data analysis': 'Data Analysis',
      'analytics': 'Analytics',

      // Soft skills
      'leadership': 'Leadership',
      'team management': 'Team Management',
      'communication': 'Communication',
      'problem solving': 'Problem Solving',
      'critical thinking': 'Critical Thinking',
      'project management': 'Project Management',
      'agile': 'Agile',
      'scrum': 'Scrum',
      'stakeholder management': 'Stakeholder Management',
      'negotiation': 'Negotiation',

      // Domain
      'marketing': 'Marketing',
      'sales': 'Sales',
      'product management': 'Product Management',
      'ux': 'UX Design',
      'ui': 'UI Design',
      'brand': 'Brand Strategy',
      'seo': 'SEO',
      'content': 'Content Strategy'
    };

    const foundSkills = new Set();

    // Search for matching keywords
    Object.entries(skillKeywords).forEach(([keyword, skillName]) => {
      if (jdLower.includes(keyword)) {
        foundSkills.add(skillName);
      }
    });

    // If found skills, return them; otherwise return generic skills
    const skills = Array.from(foundSkills).slice(0, 5);

    if (skills.length === 0) {
      // Fallback if no keywords found
      return JSON.stringify(['Communication', 'Problem Solving', 'Team Collaboration']);
    }

    return JSON.stringify(skills);
  }
  if (systemLower.includes('generate interview questions') || systemLower.includes('questions')) {
    // Extract context from the user message
    const titleMatch = lastMessage.match(/Generate interview questions for a (\w+) ([^\n.]+)\./);
    const level = titleMatch ? titleMatch[1] : 'Mid';
    const jobTitle = titleMatch ? titleMatch[2] : 'position';

    const skillsMatch = lastMessage.match(/Skills to evaluate: ([^\n]+)/);
    const skillsStr = skillsMatch ? skillsMatch[1] : '';
    const skills = skillsStr.split(', ').map(s => s.trim()).filter(Boolean);

    const jdMatch = lastMessage.match(/JD: ([\s\S]+)$/);
    const jdText = jdMatch ? jdMatch[1].toLowerCase() : '';

    console.log('[MOCK] Level:', level, '| JobTitle:', jobTitle, '| Skills:', skills);

    // Helper: Extract key keywords from JD for contextual questions
    const getContextKeywords = (skill) => {
      const skillLower = skill.toLowerCase();
      const keywords = [];

      if (jdText.includes('scale') || jdText.includes('million') || jdText.includes('high volume')) {
        keywords.push('scale');
      }
      if (jdText.includes('performance') || jdText.includes('optimize') || jdText.includes('optimization')) {
        keywords.push('performance');
      }
      if (jdText.includes('pipeline') || jdText.includes('etl') || jdText.includes('data flow')) {
        keywords.push('pipeline');
      }
      if (jdText.includes('real-time') || jdText.includes('streaming')) {
        keywords.push('real-time');
      }
      if (jdText.includes('aws') || jdText.includes('cloud') || jdText.includes('gcp')) {
        keywords.push('cloud');
      }
      if (jdText.includes('team') || jdText.includes('leadership') || jdText.includes('manage')) {
        keywords.push('team');
      }
      return keywords;
    };

    // Helper: Generate questions based on level and skill context
    const generateContextAwareQuestions = (skill, level, keywords) => {
      const questions = [];
      const skillBase = skill.toLowerCase();

      if (level === 'Senior') {
        // Senior level: deep, architectural, system-design questions
        if (keywords.includes('scale')) {
          questions.push(`Describe how you would architect ${skill} for a system handling millions of requests. What trade-offs would you make?`);
        } else {
          questions.push(`Walk us through a complex ${skill} problem you solved. What was your approach and why?`);
        }

        if (keywords.includes('performance')) {
          questions.push(`How do you approach performance optimization for ${skill}? Share a specific example.`);
        } else {
          questions.push(`What are the key considerations when designing systems with ${skill}?`);
        }

        questions.push(`Tell us about a time ${skill} challenges required you to think outside the box.`);
      } else if (level === 'Junior') {
        // Junior level: fundamental, practical understanding
        questions.push(`Tell me about your experience with ${skill}. What projects have you used it in?`);
        questions.push(`Explain how you would use ${skill} to solve a real-world problem.`);
        questions.push(`What's one thing about ${skill} that you find challenging and how are you improving?`);
      } else {
        // Mid level: balanced between depth and breadth
        if (keywords.includes('pipeline')) {
          questions.push(`Describe a data ${skill} pipeline you've built. How did you handle errors and monitoring?`);
        } else {
          questions.push(`Can you share a situation where you had to apply ${skill} in a non-obvious way?`);
        }

        questions.push(`How do you stay current with ${skill} best practices and latest developments?`);
        questions.push(`What challenges have you faced with ${skill} and how did you overcome them?`);
      }

      return questions.slice(0, 3); // Return exactly 3 questions
    };

    const questions_by_skill = {};
    if (skills.length > 0) {
      skills.forEach(skill => {
        const keywords = getContextKeywords(skill);
        questions_by_skill[skill] = generateContextAwareQuestions(skill, level, keywords);
      });
    } else {
      // Fallback if skills can't be extracted
      questions_by_skill['Skill 1'] = [
        'Tell me about your experience.',
        'How do you approach problem-solving?',
        'Describe a challenge you overcame.'
      ];
    }

    console.log('[MOCK] Generated context-aware questions:', JSON.stringify(questions_by_skill));
    return JSON.stringify({ questions_by_skill });
  }
  if (systemLower.includes('opening greeting') || (systemLower.includes('hr interviewer') && systemLower.includes('warm'))) {
    // Mock opening greeting for interview
    return `Hello! Thank you for taking the time to interview with us today. I'm excited to learn more about your background and experience. Let's dive right in and explore your qualifications for this role!`;
  }
  if (systemLower.includes('evaluate') || systemLower.includes('candidate')) {
    return `That's a great answer! I appreciate your detailed explanation. You clearly have solid understanding of this area. [[ANSWER_GOOD]]`;
  }

  return 'Mock response for testing';
};

const callQwen = async (messages, systemPrompt = null) => {
  try {
    if (isPlaceholderKey()) {
      console.log('[MOCK MODE] Returning mock response (API key not configured)');
      return getMockResponse(systemPrompt, messages);
    }

    const payload = {
      model: QWEN_MODEL,
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      top_p: 0.8,
      temperature: 0.7,
      max_tokens: 2000
    };

    const response = await axios.post(QWEN_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Handle both DashScope and OpenAI-compatible response formats
    if (response.data.output?.text) {
      return response.data.output.text;
    } else if (response.data.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Unexpected response format from API');
    }
  } catch (error) {
    console.error('Qwen API error:', error.message);
    // Fallback to mock mode if API fails
    console.log('[FALLBACK] Using mock response due to API error');
    return getMockResponse(systemPrompt, messages);
  }
};

module.exports = { callQwen };
