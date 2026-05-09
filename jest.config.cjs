module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/features/**/*.ts',
    'src/lib/**/*.ts',
    'src/providers/**/*.tsx',
    'src/schemas/**/*.ts',
    'src/services/**/*.ts',
    '!src/features/**/use-*.ts',
    '!src/services/auth/token-storage.ts',
    '!src/**/*.d.ts',
    '!src/**/README.md',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/tests/',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
