/* eslint-env node */

const { node: restrictedImports } = require('@uniswap/eslint-config/restrictedImports')
require('@uniswap/eslint-config/load')

const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = 'eslint_rules'

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/react'],
  plugins: ['rulesdir'],

  rules: {
    // TODO: had to add this rule to avoid errors on monorepo migration that didnt happen in interface
    'cypress/unsafe-to-chain-command': 'off',
  },

  overrides: [
    {
      files: ['**/*'],
      rules: {
        'multiline-comment-style': ['error', 'separate-lines'],
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
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            ...restrictedImports,
            paths: [
              ...restrictedImports.paths,
              {
                name: '@uniswap/smart-order-router',
                message: 'Only import types, unless you are in the client-side SOR, to preserve lazy-loading.',
                allowTypeImports: true,
              },
              {
                name: 'moment',
                // tree-shaking for moment is not configured because it degrades performance - see craco.config.cjs.
                message: 'moment is not configured for tree-shaking. If you use it, update the Webpack configuration.',
              },
              {
                name: 'react-helmet-async',
                // default package's esm export is broken, but the explicit cjs export works.
                message: `Import from 'react-helment-async/lib/index' instead.`,
              },
              {
                name: 'zustand',
                importNames: ['default'],
                message: 'Default import from zustand is deprecated. Import `{ create }` instead.',
              },
            ],
          },
        ],
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
        'no-restricted-syntax': [
          'error',
          {
            selector: ':matches(ExportAllDeclaration)',
            message: 'Barrel exports bloat the bundle size by preventing tree-shaking.',
          },
          {
            selector: `:matches(Literal[value='NATIVE'])`,
            message:
              "Don't use the string 'NATIVE' directly. Use the NATIVE_CHAIN_ID variable from constants/tokens instead.",
          },
        ],
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      excludedFiles: ['src/analytics/*'],
      rules: {
        // Uses 'no-restricted-imports' to avoid overriding the above rules in '@typescript-eslint/no-restricted-imports'
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@uniswap/analytics',
                message: `Do not import from '@uniswap/analytics' directly. Use 'analytics' instead.`,
              },
            ],
          },
        ],
      },
    },
  ],
}
