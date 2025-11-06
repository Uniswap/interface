// The ESLint browser environment defines all browser globals as valid,
// even though most people don't know some of them exist (e.g. `name` or `status`).
// This is dangerous as it hides accidentally undefined variables.
// We blocklist the globals that we deem potentially confusing.
// To use them, explicitly reference them, e.g. `window.name` or `window.status`.
const restrictedGlobals = require('confusing-browser-globals')

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  plugins: [
    'import',
    'unused-imports',
    'check-file',
    'local-rules',
    'react',
    'react-hooks',
    'security',
    'no-unsanitized',
    '@typescript-eslint',
  ],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Imports and file naming
    'check-file/no-index': ['error', { ignoreMiddleExtensions: true }],
    'unused-imports/no-unused-imports': 'error',

    // Basics
    'react/display-name': 'error',
    'no-shadow': 'off',
    'no-ex-assign': 'error',
    'no-eval': 'error',
    'guard-for-in': 'error',
    'no-extra-boolean-cast': 'error',
    'object-shorthand': ['error', 'always'],
    'consistent-return': ['error', { treatUndefinedAsUnspecified: false }],
    'max-lines': ['error', 500], // cap file length
    // Disallow unnecessary curly braces in JSX props and children
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'max-params': ['error', { max: 2 }],

    // Rules within the standard React plugin
    'react/no-danger': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-unsafe': 'error',

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
    'security/detect-non-literal-regexp': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-new-buffer': 'error',

    // Globals.
    // The Extension config overrides this rule, so make sure to verify if we need to
    // update `apps/extension/.eslintrc.js` if you make any changes here.
    'no-restricted-globals': ['error'].concat(restrictedGlobals, [
      {
        name: 'chrome',
        message:
          'Direct `chrome` access is restricted to prevent accidental usage in the wrong context. Use `getChrome()` or `getChromeWithThrow()` instead.',
      },
    ]),

    // Custom Rules
    'local-rules/no-unwrapped-t': ['error', { blockedElements: ['Flex', 'AnimatedFlex', 'TouchableArea', 'Trace'] }],

    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: 'e',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
  overrides: [
    // All Typescript Files
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
        'local-rules/prevent-this-method-destructure': 'error',
        'local-rules/enforce-query-options-result': [
          'error',
          {
            importPath: 'utilities/src/reactQuery/queryOptions',
          },
        ],
        curly: 'error',
        '@typescript-eslint/prefer-enum-initializers': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unnecessary-condition': [
          'error',
          {
            allowConstantLoopConditions: true,
          },
        ],
      },
    },
    // Non-Test Typescript Files
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: ['*.test.ts', '*.test.tsx'],
      rules: {
        'no-console': 'error',
        'local-rules/no-hex-string-casting': 'error',
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
    // Test Files
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)', '*.e2e.js'],
      env: {
        jest: true,
        'jest/globals': true,
      },
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
    },
    {
      // Allow test files to exceed max-lines limit
      files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
      rules: {
        'max-lines': 'off',
      },
    },
  ],
}
