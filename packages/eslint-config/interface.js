const biomeSupportedRules = require('./biome-supported')
const { reactNative: reactNativeImports } = require('@uniswap/eslint-config/restrictedImports')

module.exports = {
  extends: [require.resolve('./base.js')],
  env: {
    browser: true,
    node: false,
  },
  plugins: ['react', 'react-hooks', 'no-relative-import-paths', 'local-rules'],
  ignorePatterns: ['**/__generated__/'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Disable all ESLint rules that have been migrated to Biome
    ...biomeSupportedRules,
    'react/react-in-jsx-scope': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: ['functions/**'],
      rules: {
        'import/no-unused-modules': ['error', { unusedExports: true }],
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      excludedFiles: ['**/*.native.*', '**/*.ios.*', '**/*.android.*'],
      rules: {
        '@typescript-eslint/no-restricted-imports': ['error', reactNativeImports],
      },
    },
  ],
}
