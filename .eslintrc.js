module.exports = {
  root: true,
  extends: ['@react-native-community', 'plugin:jest/recommended', 'plugin:prettier/recommended'],
  rules: {
    'no-eval': 'error',
    'no-extra-boolean-cast': 'error',
    'no-ex-assign': 'error',
    'no-console': 'warn',
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
          {
            name: 'src/features/telemetry',
            importNames: ['logException'],
            message: 'Please use `logger.error` instead.',
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
    // Security Linting
    // Mozilla's No Unsanitized - https://github.com/mozilla/eslint-plugin-no-unsanitized
    'no-unsanitized/method': 'error',
    'no-unsanitized/property': 'error',
    // Generic Security Linting - https://www.npmjs.com/package/eslint-plugin-security
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-new-buffer': 'error',
    // Rules within the standard React plugin
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-unsafe': 'error',
    // Overwrite default Prettier settings - https://prettier.io/docs/en/options.html
    'prettier/prettier': [
      'error',
      {
        bracketSameLine: true,
        singleQuote: true,
        printWidth: 100,
        semi: false,
      },
    ],
  },
  plugins: ['detox', 'jest', 'react', 'react-native', 'no-unsanitized', 'security'],
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
