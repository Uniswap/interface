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
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'enumMember',
        format: ['PascalCase'],
      },
    ],
    // Required for e2e usecases
    'jest/no-export': 'off',
    'jest/valid-describe-callback': 'off',
    'jest/valid-title': [
      'error',
      {
        // jest expect string titles, but we use function names in the codebase
        ignoreTypeOfDescribeName: true,
      },
    ],
    // Required for e2e usecases
    'jest/expect-expect': ['off', { assertFunctionNames: ['expect', 'expectSaga'] }],
    // Required for exception catching tests
    'jest/no-conditional-expect': 'off',
    'jest/no-disabled-tests': 'off',
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
          {
            name: 'react',
            importNames: ['Suspense'],
            message: 'Please use Suspense from src/components/data instead.',
          },
        ],
      },
    ],
    // React Plugin
    // Overrides rules from @react-native-community:
    // https://github.com/facebook/react-native/blob/3cf0291008dfeed4d967ebb95bdccbe2d52c5b81/packages/eslint-config-react-native-community/index.js#L287
    'react/jsx-sort-props': [
      'error',
      {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: false,
        noSortAlphabetically: false,
        reservedFirst: true,
      },
    ],
    // Disallow unnecessary curly braces in JSX props and children
    'react/jsx-curly-brace-presence': [
      'error',
      { props: 'never', children: 'never', propElementValues: 'always' },
    ],
    // TODO: consider re-enabling this as part of perf assessment
    'react/no-unstable-nested-components': 'off',
    // React-Native Plugin
    // Overrides rules from @react-native-community:
    // https://github.com/facebook/react-native/blob/3cf0291008dfeed4d967ebb95bdccbe2d52c5b81/packages/eslint-config-react-native-community/index.js#L313
    'react-native/no-unused-styles': 'error',
    'react-native/sort-styles': 'error',
  },
  plugins: ['detox', 'jest', 'react', 'react-native'],
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
    AddressTo: 'readonly',
    Nullable: 'readonly',
  },
  parser: '@typescript-eslint/parser',
}
