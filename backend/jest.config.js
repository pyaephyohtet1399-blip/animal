module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/setup-env.js'],
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testTimeout: 30000
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/tests/setup-env.js'],
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testTimeout: 30000
    }
  ],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageDirectory: 'coverage',
  coverageThreshold: { global: { lines: 80, statements: 80 } }
};
