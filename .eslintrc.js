/* eslint-env node */

require('@uniswap/eslint-config/load')

const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = 'eslint_rules'

module.exports = {
  extends: ['@uniswap/eslint-config/react'],
  plugins: ['rulesdir'],
  overrides: [
    {
      files: ['**/*'],
      rules: {
        'multiline-comment-style': ['error', 'separate-lines'],
        'rulesdir/enforce-retry-on-import': 'error',
        'rulesdir/no-undefined-or': 'error',
      },
    },
    {
      // Configuration/typings typically export objects/definitions that are used outside of the transpiled package
      // (eg not captured by the tsconfig). Because it's typical and not exceptional, this is turned off entirely.
      files: ['**/*.config.*', '**/*.d.ts'],
      rules: {
        'import/no-unused-modules': 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              {
                target: ['src/**/*[!.test].ts', 'src/**/*[!.test].tsx'],
                from: 'src/test-utils',
              },
            ],
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'moment',
                // tree-shaking for moment is not configured because it degrades performance - see craco.config.cjs.
                message: 'moment is not configured for tree-shaking. If you use it, update the Webpack configuration.',
              },
              {
                name: 'zustand',
                importNames: ['default'],
                message: 'Default import from zustand is deprecated. Import `{ create }` instead.',
              },
            ],
          },
        ],
      },
    },
  ],
}
