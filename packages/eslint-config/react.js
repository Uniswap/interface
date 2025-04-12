let { interface: restrictedImports } = require('@uniswap/eslint-config/restrictedImports')

module.exports = {
  extends: [require.resolve('./base.js'), 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
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
    'import/no-unused-modules': ['error', { unusedExports: true }],
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
      excludedFiles: ['*.native.*', '*.ios.*', '*.android.*'],
      rules: {
        '@typescript-eslint/no-restricted-imports': ['error', restrictedImports],
      },
    },
  ],
}
