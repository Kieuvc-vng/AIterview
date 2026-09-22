// src/services/qwenClient.js
const axios = require('axios');

const QWEN_API_KEY = process.env.QWEN_API_KEY;
const QWEN_MODEL = process.env.QWEN_MODEL || 'qwen-3.7-plus';
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

const isPlaceholderKey = () => !QWEN_API_KEY || QWEN_API_KEY.includes('your_');

const getMockResponse = (systemPrompt, messages) => {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const systemLower = systemPrompt?.toLowerCase() || '';

  if (systemLower.includes('extract job title') || systemLower.includes('job title')) {
    return JSON.stringify({
      job_title: 'Data Engineer',
      level: 'Mid',
      company: 'Tech Company'
    });
  }
  if (systemLower.includes('extract key skills') || systemLower.includes('key skills')) {
    return JSON.stringify({
      skills: ['Python', 'SQL', 'Data Pipelines', 'Apache Spark', 'System Design']
    });
  }
  if (systemLower.includes('generate interview questions') || systemLower.includes('questions')) {
    return JSON.stringify({
      'Python': ['Explain list comprehensions', 'What are decorators?'],
      'SQL': ['Optimize a slow query', 'Explain JOIN types'],
      'Data Pipelines': ['Design a data pipeline', 'Handle data quality issues']
    });
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

    return response.data.output.text;
  } catch (error) {
    console.error('Qwen API error:', error.message);
    throw new Error(`Qwen API failed: ${error.message}`);
  }
};

module.exports = { callQwen };
