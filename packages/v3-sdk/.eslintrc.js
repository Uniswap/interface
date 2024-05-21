module.exports = {
  root: true,
  extends: ['@ubeswap/eslint-config/node'],
  ignorePatterns: ['node_modules', '.turbo', '.eslintrc.js', 'codegen.ts'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/naming-convention': 'off',
        'jest/valid-expect': 'off',
        '@typescript-eslint/prefer-as-const': 'off',
        '@typescript-eslint/no-restricted-imports': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {},
    },
    {
      files: ['*.js', '*.jsx'],
      rules: {},
    },
  ],
  rules: {},
}
