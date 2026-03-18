const biomeSupportedRules = require('@uniswap/eslint-config/biome-supported')

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native'],
  ignorePatterns: ['node_modules', '.turbo', '.eslintrc.js', 'codegen.ts', '.nx'],
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
      files: ['**'],
      rules: {
        // Disable all ESLint rules that have been migrated to Biome
        ...biomeSupportedRules,
      },
    },
    {
      files: ['src/components/landing/elements/index.tsx', 'src/index.ts', 'src/state/index.ts', 'src/test/**'],
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
            prefix: 'wallet',
          },
        ],
      },
    },
  ],
  rules: {},
}
