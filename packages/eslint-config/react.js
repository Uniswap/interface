const { react: reactRestrictedImports } = require('./restrictedImports')

module.exports = {
  extends: [require.resolve('./node.js'), 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  env: {
    browser: true,
    node: false,
  },
  plugins: ['react', 'react-hooks'],
  ignorePatterns: ['**/__generated__/'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/no-restricted-imports': ['error', reactRestrictedImports],
      },
    },
  ],
}
