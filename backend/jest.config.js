module.exports = {
  preset: 'ts-jest', 
  testEnvironment: 'node', 
  roots: ['<rootDir>/src', '<rootDir>/src/__tests__'], 
  testMatch: [ 
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true, 
  coverageDirectory: 'coverage', 
  coverageProvider: 'v8', 
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
  },
};