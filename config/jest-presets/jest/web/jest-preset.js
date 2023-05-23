// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */
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
  moduleDirectories: ["node_modules", "src"],
  moduleFileExtensions: ["ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node", "mp4"],
  moduleNameMapper: {
    '.+\\.(css|style|less|sass|scss|png|jpg|ttf|woff|woff2|mp4)$': 'jest-transform-stub',
    // Jest by default doesn't support absolute imports out of the box
    '^src/(.*)$': '<rootDir>/src/$1',
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
