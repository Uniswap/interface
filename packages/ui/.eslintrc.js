const biomeSupportedRules = require('@uniswap/eslint-config/biome-supported')

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native'],
  ignorePatterns: [
    'node_modules',
    '.turbo',
    'dist',
    'types',
    '.eslintrc.js',
    '**/*.test.tsx',
    'jest.config.js',
    'babel.config.js',
    '.nx',
  ],
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    // Disable all ESLint rules that have been migrated to Biome
    ...biomeSupportedRules,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'check-file/no-index': 'off',
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
            prefix: 'ui',
          },
        ],
      },
    },
  ],
}
