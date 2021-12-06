module.exports = {
  root: true,
  extends: ['@react-native-community', 'plugin:jest/recommended'],
  rules: {
    curly: 'off',
    'no-eval': 'error',
    'no-extra-boolean-cast': 'error',
    'no-ex-assign': 'error',
    'no-console': 'warn',
    semi: 'off',
    // https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-require-imports': 'warn',
    'jest/valid-describe': 'off',
    // TODO consider enabling these:
    // '@typescript-eslint/no-floating-promises': 'error',
    // 'import/no-self-import': 2,
    // 'import/no-duplicates': 2,
    // 'import/no-default-export': 1,
    // 'react/jsx-uses-react': 'off',
    // 'react/react-in-jsx-scope': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@ethersproject',
            message: "Please import from 'ethers' directly to support tree-shaking.",
          },
        ],
      },
    ],
  },
  plugins: ['detox', 'jest'],
  overrides: [
    {
      files: ['*.e2e.js'],
      env: {
        'detox/detox': true,
        jest: true,
        'jest/globals': true,
      },
    },
  ],
  globals: {
    Address: 'readonly',
    Nullable: 'readonly',
  },
}
