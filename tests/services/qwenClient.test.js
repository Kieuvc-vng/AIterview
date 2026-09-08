// tests/services/qwenClient.test.js
const { callQwen } = require('../../src/services/qwenClient');

describe('Qwen Client', () => {
  test('callQwen returns string response', async () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await callQwen(messages);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  }, 15000);
});
