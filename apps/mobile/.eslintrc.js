module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native'],
  ignorePatterns: ['.storybook/storybook.requires.ts'],
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['index.js', 'src/index.ts', 'src/polyfills/index.ts', 'src/test/fixtures/*'],
      rules: {
        'check-file/no-index': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
            prefix: 'src',
          },
        ],
      },
    },
  ],
}
