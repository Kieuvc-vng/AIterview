/**
 * Jest Configuration for AI Interview App
 * Tests run against backend services and routes
 */

module.exports = {
  // Use Node environment instead of jsdom
  testEnvironment: 'node',

  // Test file patterns - only run proper Jest tests in tests/ directory
  testMatch: [
    '**/tests/**/*.test.js'
  ],

  // Skip tests with external dependencies (database, API keys)
  testPathIgnorePatterns: [
    'qwenClient.test.js',
    'sessionManager.test.js',
    'setupRoutes.test.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/db/init.js'
  ],

  // Minimum coverage thresholds
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],

  // Don't transform node_modules
  transformIgnorePatterns: [
    '/node_modules/'
  ],

  // Mock uuid to avoid ESM issues in tests
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Test timeout (for async tests)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
