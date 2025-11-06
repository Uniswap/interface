// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

const { native: restrictedImports } = require('@uniswap/eslint-config/restrictedImports')

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      modules: true,
      experimentalObjectRestSpread: true,
    },
  },
  extends: [
    require.resolve('./base.js'),
    'eslint:recommended',
    '@react-native-community',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [
    'jest',
    'no-relative-import-paths',
    'react',
    'react-native',
    '@typescript-eslint',
    '@jambit/typed-redux-saga',
    'check-file',
    'local-rules',
  ],
  rules: {
    // Platform specific restricted imports
    '@typescript-eslint/no-restricted-imports': ['error', restrictedImports],

    // Complexity Rules
    'max-depth': ['error', 4], // prevent deeply nested code paths which are hard to read
    'max-nested-callbacks': ['error', 3],
    complexity: ['error', 20], // restrict cyclomatic complexity (number of linearly independent paths)

    // disable prettier linting, as we format with biome:
    'prettier/prettier': 0,
    semi: 0,
    quotes: 0,
    'comma-dangle': 0,
    'no-trailing-spaces': 0,

    // tamagui encourages inline styles and makes them fast
    'react-native/no-inline-styles': 'off',

    '@typescript-eslint/no-unused-expressions': [
      2,
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],
    '@typescript-eslint/naming-convention': [
      2,
      {
        selector: 'enumMember',
        format: ['PascalCase'],
      },
    ],
    // Required for e2e use cases
    'jest/no-export': 'off',
    'jest/valid-describe-callback': 'off',
    'jest/valid-title': [
      2,
      {
        // jest expect string titles, but we use function names in the codebase
        ignoreTypeOfDescribeName: true,
      },
    ],
    // Required for e2e use cases
    'jest/expect-expect': [0, { assertFunctionNames: ['expect', 'expectSaga'] }],
    // Required for exception catching tests
    'jest/no-conditional-expect': 'off',
    'jest/no-disabled-tests': 'off',
    'react-hooks/exhaustive-deps': [
      'error',
      {
        // https://docs.swmansion.com/react-native-reanimated/docs/guides/web-support/
        additionalHooks: '(useAnimatedStyle|useDerivedValue|useAnimatedProps)',
      },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "CallExpression[callee.property.name='sendMessage'][callee.object.property.name='tabs'][callee.object.object.name='chrome']",
        message:
          'Please use a message channel from apps/extension/src/background/messagePassing/messageChannels.ts instead of chrome.tabs.sendMessage.',
      },
      {
        selector:
          "CallExpression[callee.property.name='sendMessage'][callee.object.property.name='runtime'][callee.object.object.name='chrome']",
        message:
          'Please use a message channel from apps/extension/src/background/messagePassing/messageChannels.ts instead of chrome.runtime.sendMessage.',
      },
      {
        selector:
          "CallExpression[callee.property.name='addListener'][callee.object.property.name='onMessage'][callee.object.object.property.name='runtime'][callee.object.object.object.name='chrome']",
        message:
          'Please use a message channel from apps/extension/src/background/messagePassing/messageChannels.ts instead of chrome.runtime.onMessage.addListener.',
      },
      {
        selector:
          "CallExpression[callee.property.name='removeListener'][callee.object.property.name='onMessage'][callee.object.object.property.name='runtime'][callee.object.object.object.name='chrome']",
        message:
          'Please use a message channel from apps/extension/src/background/messagePassing/messageChannels.ts instead of chrome.runtime.onMessage.removeListener.',
      },
      {
        selector: "CallExpression[callee.object.name='z'][callee.property.name='any']",
        message: 'Avoid using z.any() in favor of more precise custom types, unless absolutely necessary.',
      },
    ],
    // React Plugin
    // Overrides rules from @react-native-community:
    // https://github.com/facebook/react-native/blob/3cf0291008dfeed4d967ebb95bdccbe2d52c5b81/packages/eslint-config-react-native-community/index.js#L287
    'react/jsx-sort-props': [
      2,
      {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: false,
        noSortAlphabetically: true,
        reservedFirst: true,
      },
    ],
    // React-Native Plugin
    // Overrides rules from @react-native-community:
    // https://github.com/facebook/react-native/blob/3cf0291008dfeed4d967ebb95bdccbe2d52c5b81/packages/eslint-config-react-native-community/index.js#L313
    'react-native/no-unused-styles': 'error',
    'react-native/sort-styles': 'error',

    // To be shared, requires notable fixing to share
    'react/no-unstable-nested-components': 'error',

    // Same but can't be shared for some reason
    'react/react-in-jsx-scope': 'off',
    'consistent-return': ['error', { treatUndefinedAsUnspecified: false }],

    // Requires some investigation to move
    // https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-shadow': 'error',

    // use throughout the app when importing devtools, or in test files
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'max-params': ['error', { max: 2 }],
  },
  overrides: [
    {
      files: ['**/utils/haptics/**'],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            paths: restrictedImports.paths.filter((rule) => rule.name !== 'expo-haptics'),
          },
        ],
      },
    },
    {
      // enable these rules specifically for TypeScript files
      files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': ['error', { allowedNames: ['useEffect'] }],
      },
    },
    {
      // TypeScript rules for non-test files (can be a bit more strict)
      files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
      excludedFiles: ['migrations.ts', './**/*.test.ts', './**/*.test.tsx', './test/**'],
      rules: {
        '@typescript-eslint/prefer-enum-initializers': 'error',
        '@typescript-eslint/no-unsafe-return': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-empty-interface': 'warn',
      },
    },
    // ignore return type in saga files given return types are unwieldy and tied
    // to implementation details.
    {
      files: ['*saga*.ts', '*Saga.ts', 'handleDeepLink.ts'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
    // Typescript only files
    {
      files: ['./**/*.ts', './**/*.tsx'],
      excludedFiles: ['./**/*.test.ts', './**/*.test.tsx'],
      rules: {
        // enforce saga imports from typed-redux-saga
        '@jambit/typed-redux-saga/use-typed-effects': 'error',
        '@jambit/typed-redux-saga/delegate-effects': 'error',
        'no-console': 'error',
        'react/forbid-elements': [
          'error',
          {
            forbid: [
              {
                element: 'div',
                message: 'Please avoid using div when possible, even in web code! Use `Flex` or  Fragments (`<>`).',
              },
            ],
          },
        ],
      },
    },
    // Allow more depth for testing files
    {
      files: ['./**/*.test.ts', './**/*.test.tsx'],
      rules: {
        'max-nested-callbacks': ['error', 4],
      },
    },
  ],
}
