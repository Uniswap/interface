/* eslint-env node */

const { crossPlatform: restrictedImports } = require('@uniswap/eslint-config/restrictedImports')
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

    // let prettier do things:
    semi: 0,
    quotes: 0,
    'comma-dangle': 0,
    'no-trailing-spaces': 0,
    'no-extra-semi': 0,
  },

  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
            rootDir: 'src',
          },
        ],
      },
    },
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
            paths: [
              {
                name: 'styled-components',
                message: 'Styled components is deprecated, please use Flex or styled from "ui/src" instead.'
              },
              {
                name: 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks',
                importNames: ['usePortfolioBalancesQuery', 'usePortfolioBalancesWebLazyQuery'],
                message: 'Import cached/subscription-based balance hooks from `TokenBalancesProvider.tsx` instead.',
              },
              {
                name: 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks',
                importNames: ['useActivityWebQuery'],
                message: 'Import cached/subscription-based activity hooks from `AssetActivityProvider` instead.',
              },
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
              {
                name: 'utilities/src/platform',
                importNames: ['isIOS', 'isAndroid'],
                message:
                  'Importing isIOS and isAndroid from platform is not allowed. Use isWebIOS and isWebAndroid instead.',
              },
              {
                name: 'wagmi',
                importNames: ['useChainId', 'useAccount'],
                message: 'Import properly typed account data from `hooks/useAccount` instead.',
              },
              {
                name: 'wagmi',
                importNames: ['useConnect'],
                message: 'Import wrapped useConnect util from `hooks/useConnect` instead.',
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
          {
            selector: `ImportDeclaration[source.value='@uniswap/sdk-core'] > ImportSpecifier[imported.name='ChainId']`,
            message: "Don't use ChainId from @uniswap/sdk-core. Use the InterfaceChainId from universe/uniswap.",
          },
          // TODO(WEB-4251) - remove useWeb3React rules once web3 react is removed
          {
            selector: `VariableDeclarator[id.type='ObjectPattern'][init.callee.name='useWeb3React'] > ObjectPattern > Property[key.name='account']`,
            message:
              "Do not use account directly from useWeb3React. Use the useAccount hook from 'hooks/useAccount' instead.",
          },
          {
            selector: `VariableDeclarator[id.type='ObjectPattern'][init.callee.name='useWeb3React'] > ObjectPattern > Property[key.name='chainId']`,
            message:
              "Do not use chainId directly from useWeb3React. Use the useAccount hook from 'hooks/useAccount' and access account.chainId instead.",
          },
          {
            selector: `VariableDeclarator[id.type='ObjectPattern'][init.callee.name='useAccount'] > ObjectPattern > Property[key.name='address']`,
            message:
              "Do not use address directly from useWeb3React. Use the useAccount hook from 'hooks/useAccount' and access account.address instead.",
          },
        ],
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: ['*.native.*', '*.ios.*', '*.android.*'],
      rules: {
        'no-restricted-imports': ['error', restrictedImports],
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      excludedFiles: ['src/analytics/*'],
      rules: {},
    },
  ],
}
