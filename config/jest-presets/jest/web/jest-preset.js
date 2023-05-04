const globals = require('../globals')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  displayName: 'Mobile App',
  testEnvironment: 'jsdom',
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    '\\.svg$': 'jest-transformer-svg',
  },
  // coverageDirectory: '<rootDir>/coverage',
  // coverageReporters: ['json','lcov','html'],
  // collectCoverageFrom: [
  //   '<rootDir>/packages/**/src/**/*.ts',
  // ],
  moduleFileExtensions: ["ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"],
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
  },
  modulePathIgnorePatterns: ["<rootDir>/node_modules"],
  testPathIgnorePatterns: ['<rootDir>/node_modules'],
  testMatch: [
    '<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  setupFilesAfterEnv: [
    "<rootDir>/../../config/jest-presets/jest/web/setup.js"
  ],
  ...globals
};
