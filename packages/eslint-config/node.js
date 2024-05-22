const { node: nodeRestrictedImports } = require('./restrictedImports')

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  plugins: ['import', 'unused-imports'],
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        semi: false,
        singleQuote: true,
        printWidth: 120,
      },
    ],
    'import/no-unused-modules': ['error', { unusedExports: true }],
    'object-shorthand': ['error', 'always'],
    'unused-imports/no-unused-imports': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:import/typescript'],
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-restricted-imports': ['error', nodeRestrictedImports],
      },
    },
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
      excludedFiles: '**/cypress/**',
      env: {
        jest: true,
        'jest/globals': true,
      },
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
    },
    {
      files: ['**/cypress/**/*.[jt]s?(x)'],
      env: {
        'cypress/globals': true,
      },
      extends: ['plugin:cypress/recommended'],
      plugins: ['cypress'],
    },
    {
      files: ['*'],
      plugins: ['prettier'],
      extends: ['plugin:prettier/recommended'],
    },
  ],
}
