export default {
  verbose: true,
  collectCoverage: !!process.env.CI,
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/coverage', '/node_modules/', '__tests__', '__bench__'], 
  coverageDirectory: './coverage',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '\\.ts$': '@swc/jest',
  },
  testMatch: ['**/__tests__/**/*.ts'],
};
