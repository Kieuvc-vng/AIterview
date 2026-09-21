// src/services/qwenClient.js
const axios = require('axios');

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen/qwen3.7-plus';
const QWEN_API_BASE_URL = process.env.QWEN_API_BASE_URL || 'https://maas-lle-aiplatform-hcm.api.vngcloud.vn/v2';
const QWEN_API_URL = `${QWEN_API_BASE_URL}/chat/completions`;

const isPlaceholderKey = () => !QWEN_API_KEY || QWEN_API_KEY.includes('your_');

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
    // Extract skills from the user message to generate questions for those specific skills
    const skillsMatch = lastMessage.match(/Skills to evaluate: ([^\n]+)/);
    const skillsStr = skillsMatch ? skillsMatch[1] : '';
    const skills = skillsStr.split(', ').map(s => s.trim()).filter(Boolean);

    console.log('[MOCK] Generating questions for skills:', skills, '| skillsStr:', skillsStr);

    const questions_by_skill = {};
    if (skills.length > 0) {
      skills.forEach(skill => {
        questions_by_skill[skill] = [
          `Tell me about your experience with ${skill}.`,
          `How do you apply ${skill} in your work?`,
          `What challenges have you faced with ${skill}?`
        ];
      });
    } else {
      // Fallback if skills can't be extracted
      questions_by_skill['Skill 1'] = ['Tell me about your experience.', 'How do you approach problem-solving?'];
    }

    console.log('[MOCK] Generated questions_by_skill:', JSON.stringify(questions_by_skill));
    return JSON.stringify({ questions_by_skill });
  }
  if (systemLower.includes('evaluate') || systemLower.includes('candidate')) {
    return JSON.stringify({
      answer_good: Math.random() > 0.5,
      feedback: 'Mock response - good understanding of the concept.',
      score: Math.floor(Math.random() * 4) + 6
    });
  }

  return JSON.stringify({ response: 'Mock response for testing' });
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
    throw new Error(`Qwen API failed: ${error.message}`);
  }
};

module.exports = { callQwen };
