/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Suppress console logs during tests (optional)
// global.console.log = jest.fn();
// global.console.error = jest.fn();

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock timeout for async operations
jest.setTimeout(10000);
