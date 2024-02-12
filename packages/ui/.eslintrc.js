const eslintConfig = require('@uniswap/eslint-config/native')

const noRestrictedImportsPaths = eslintConfig.rules['no-restricted-imports']?.[1]?.paths ?? []

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
  ],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          ...noRestrictedImportsPaths,
          {
            name: 'ui/src',
            message:
              'Avoid importing directly from ui/src from within the ui package which causes circular imports.',
          },
        ],
      },
    ],
  },
};
