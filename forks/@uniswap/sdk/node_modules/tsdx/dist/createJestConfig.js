"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createJestConfig(_, rootDir) {
    const config = {
        transform: {
            '.(ts|tsx)': require.resolve('ts-jest/dist'),
        },
        transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx)$'],
        moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
        collectCoverageFrom: ['src/**/*.{ts,tsx}'],
        testMatch: ['<rootDir>/**/*.(spec|test).{ts,tsx}'],
        testURL: 'http://localhost',
        rootDir,
        watchPlugins: [
            require.resolve('jest-watch-typeahead/filename'),
            require.resolve('jest-watch-typeahead/testname'),
        ],
    };
    return config;
}
exports.createJestConfig = createJestConfig;
