module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/*.test.ts'],
  testEnvironment: 'node',
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Test Report',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        sort: 'titleAsc',
        outputPath: 'test-results/test-report.html',
      },
    ],
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
  collectCoverageFrom: ['services/*.ts', '!services/*.test.ts'],
};
