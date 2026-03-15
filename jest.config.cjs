module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  clearMocks: true,
};
