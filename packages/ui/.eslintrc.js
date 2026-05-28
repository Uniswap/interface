const {
  native: { paths: nativePaths, patterns: nativePatterns },
} = require('@uniswap/eslint-config/restrictedImports')

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
    '@typescript-eslint/no-restricted-imports': [
      'error',
      {
        paths: [
          ...nativePaths,
          {
            name: 'ui/src',
            message: 'Avoid importing directly from ui/src from within the ui package which causes circular imports.',
          },
        ],
        patterns: nativePatterns,
      },
    ],
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
