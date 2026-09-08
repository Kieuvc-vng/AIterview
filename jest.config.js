/**
 * Jest Configuration for AI Interview App
 * Tests run against backend services and routes
 */

module.exports = {
  // Use Node environment instead of jsdom
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
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

  // Test timeout (for async tests)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module path alias (if needed)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
