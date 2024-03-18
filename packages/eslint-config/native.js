// this allows us to use es6, es2017, es2018 syntax (const, spread operators outside of array literals, etc.)
/* eslint-env es6, es2017, es2018 */

// reduces code complexity
const complexityRules = {
  'max-depth': ['error', 4], // prevent deeply nested code paths which are hard to read
  'max-nested-callbacks': ['error', 3],
  'max-lines': ['error', 500], // cap file length
  complexity: ['error', 20], // restrict cyclomatic complexity (number of linearly independent paths)
}

// The ESLint browser environment defines all browser globals as valid,
// even though most people don't know some of them exist (e.g. `name` or `status`).
// This is dangerous as it hides accidentally undefined variables.
// We blacklist the globals that we deem potentially confusing.
// To use them, explicitly reference them, e.g. `window.name` or `window.status`.
const restrictedGlobals = require('confusing-browser-globals')

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
    'eslint:recommended',
    '@react-native-community',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: [
    'detox',
    'jest',
    'no-relative-import-paths',
    'no-unsanitized',
    'react',
    'react-native',
    'security',
    'spellcheck',
    '@typescript-eslint',
    '@jambit/typed-redux-saga',
  ],
  rules: {
    ...complexityRules,
    // tamagui encourages inline styles and makes them fast
    'react-native/no-inline-styles': 'off',
    'guard-for-in': 'error',
    'no-eval': 'error',
    'no-extra-boolean-cast': 'error',
    'no-ex-assign': 'error',
    'no-console': 'warn',
    curly: 'error',
    'no-restricted-globals': ['error'].concat(restrictedGlobals),
    'no-relative-import-paths/no-relative-import-paths': [
      2,
      {
        allowSameFolder: true,
      },
    ],
    'object-shorthand': 'error',
    // https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
    'no-shadow': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-shadow': 'error',
    // use throughout the app when importing devtools, or in test files
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
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
    // TODO consider enabling these:
    // 'import/no-self-import': 'error',
    // 'import/no-duplicates': 'error',
    // 'import/no-default-export': 'warn',
    // 'react/jsx-uses-react': 'off',
    'react/display-name': 'error',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/exhaustive-deps': [
      'error',
      {
        // https://docs.swmansion.com/react-native-reanimated/docs/guides/web-support/
        additionalHooks: '(useAnimatedStyle|useDerivedValue|useAnimatedProps)',
      },
    ],
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
          {
            name: '@tamagui/core',
            message: "Please import from 'tamagui' directly to prevent mismatches.",
          },
          {
            name: 'utilities/src/format/localeBased',
            message: 'Use via `useLocalizationContext` instead.',
          },
          {
            name: 'wallet/src/features/fiatCurrency/conversion',
            message: 'Use via `useLocalizationContext` instead.',
          },
          {
            name: 'wallet/src/features/language/formatter',
            message: 'Use via `useLocalizationContext` instead.',
          },
          {
            name: 'react-native-safe-area-context',
            importNames: ['useSafeAreaInsets'],
            message: 'Use our internal `useDeviceInsets` hook instead.',
          },
          {
            name: 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks',
            importNames: ['usePortfolioBalancesQuery'],
            message: 'Use `usePortfolioBalances` instead.',
          },
          {
            name: 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks',
            importNames: ['useAccountListQuery'],
            message: 'Use `useAccountList` instead.',
          },
          {
            name: 'wallet/src/features/dataApi/balances',
            importNames: ['usePortfolioValueModifiers'],
            message:
              'Use the wrapper hooks `usePortfolioTotalValue`, `useAccountList` or `usePortfolioBalances` instead of `usePortfolioValueModifiers` directly.',
          },
          {
            name: '@gorhom/bottom-sheet',
            importNames: ['BottomSheetTextInput'],
            message:
              'Use our internal `BottomSheetTextInput` wrapper from `/wallet/src/components/modals/BottomSheetModal`.',
          },
          {
            name: 'expo-localization',
            message:
              'Avoid using due to issue with unsupported locales. Use utilties/src/device/locales.ts getDeviceLocales instead',
          },
        ],
      },
    ],

    'no-restricted-syntax': [
      'error',
      {
        selector: "NewExpression[callee.name='InMemoryCache']",
        message:
          'Use `createNewInMemoryCache()` instead of `new InMemoryCache()` to correctly support our custom `ttlMs` cache invalidation policy (see `useRestQuery`). See PR #5683 for details.',
      },
      {
        selector:
          "CallExpression[callee.property.name='addListener'][callee.object.property.name='onMessage'][callee.object.object.property.name='runtime'][callee.object.object.object.name='chrome']",
        message:
          'Please use addMessageListener from apps/stretch/src/background/messagePassing/messageUtils.ts instead of chrome.runtime.onMessage.addListener.',
      },
      {
        selector:
          "CallExpression[callee.property.name='removeListener'][callee.object.property.name='onMessage'][callee.object.object.property.name='runtime'][callee.object.object.object.name='chrome']",
        message:
          'Please use removeMessageListener from apps/stretch/src/background/messagePassing/messageUtils.ts instead of chrome.runtime.onMessage.removeListener.',
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
        noSortAlphabetically: false,
        reservedFirst: true,
      },
    ],
    // Disallow unnecessary curly braces in JSX props and children
    'react/jsx-curly-brace-presence': [2, { props: 'never', children: 'never', propElementValues: 'always' }],
    'react/no-unstable-nested-components': 'error',
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
      2,
      {
        bracketSameLine: true,
        singleQuote: true,
        printWidth: 100,
        semi: false,
      },
    ],
  },
  overrides: [
    {
      files: ['*.e2e.js'],
      env: {
        'detox/detox': true,
        jest: true,
        'jest/globals': true,
      },
    },
    {
      // enable the rule specifically for TypeScript files
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
    // enforce saga imports from typed-redux-saga
    {
      files: ['./**/*.ts'],
      excludedFiles: ['./**/*.test.ts', './**/*.test.tsx'],
      rules: {
        '@jambit/typed-redux-saga/use-typed-effects': 'error',
        '@jambit/typed-redux-saga/delegate-effects': 'error',
      },
    },
    // Allow more depth for testing files
    {
      files: ['./**/*.test.ts', './**/*.test.tsx'],
      rules: {
        'max-nested-callbacks': ['error', 4],
      },
    },
    {
      files: ['*.json'],
      rules: {
        // disable rule that shouldn't be applied to json files
        '@typescript-eslint/no-unused-expressions': 0,
        'spellcheck/spell-checker': [
          'error',
          {
            comments: false,
            strings: true,
            identifiers: false,
            lang: 'en_US',
            // NOTE: react-i18next uses ’ over ' for apostrophes
            skipWords: [
              'abcabcabc',
              'abc',
              'aaa',
              'br',
              'biometrics',
              'cta',
              'They’re',
              '’s',
              'device’s',
              'you’ve',
              'Couldn’t',
              'Ethereum',
              'I’m',
              'Let’s',
              'Moonpay',
              'Onboarding',
              'Uniswap',
              'We’ll',
              'What’s',
              'aren’t',
              'cancelled',
              'cancelling',
              'can’t',
              'dapp',
              'dapps',
              'don’t',
              'eth',
              'etherscan',
              'favorited',
              'haven’t',
              'isn’t',
              'it’s',
              'otp',
              'nd',
              'nft',
              'nfts',
              'num',
              'scantastic',
              'th',
              'they’ll',
              'tooltip',
              'unformatted',
              'unhidden',
              'unhide',
              'upsell',
              'usd',
              'uwu',
              'wallet’s',
              'we’re',
              'won’t',
              'you’d',
              'you’ll',
              'you’re',
              'Arbitrum',
              'blockchain',
              'validators',
              'customizable',
              'subdomains',
              'unitag',
              'defi',
              'versa',
              'Unicon',
              'yourname',
              'yourusername',
              'Unitags',
              'unicons',
              'Uw',
              'Passcode',

              // currencies and countries
              'aud',
              'brl',
              'cny',
              'eur',
              'gbp',
              'hkd',
              'idr',
              'inr',
              'jpy',
              'ngn',
              'pkr',
              'sgd',
              'thb',
              'uah',
              'vnd',
              'spanish',
              'Latam',
              'chinese',
              'english',
              'hindi',
              'indonesian',
              'japanese',
              'malay',
              'portuguese',
              'russian',
              'spanish',
              'spanish',
              'thai',
              'turkish',
              'ukrainian',
              'urdu',
              'vietnamese',
              'Naira',
              'Hryvnia',
            ],
          },
        ],
        'max-lines': ['off'], // cap file length
      },
    },
  ],
  globals: {
    Address: 'readonly',
    AddressTo: 'readonly',
    Nullable: 'readonly',
  },
}
