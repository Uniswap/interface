require('@uniswap/eslint-config/load')

module.exports = {
  extends: ['@uniswap/eslint-config/node'],
  rules: {
    'import/no-unused-modules': 'off',
    '@typescript-eslint/no-restricted-imports': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-this-alias': [
      'error',
      {
        allowDestructuring: true, // Allow `const { props, state } = this`; false by default
        allowedNames: [
          'self', // Allow `const self= this`; `[]` by default
        ],
      },
    ],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          // Allow BigInt (uppercase)
          BigInt: false,
        },
      },
    ],
  },
  ignorePatterns: ['src/types/templates/*'],
}