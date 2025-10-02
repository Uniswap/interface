/* eslint-env node */
require('@uniswap/eslint-config/load')

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/interface', 'plugin:storybook/recommended'],
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // let biome do things:
    semi: 0,
    quotes: 0,
    'comma-dangle': 0,
    'no-trailing-spaces': 0,
    'no-extra-semi': 0,
  },

  overrides: [
    {
      files: [
        'src/index.tsx',
        'src/tracing/index.ts',
        'src/state/index.ts',
        'src/state/explore/index.tsx',
        'src/components/**',
        'src/nft/**',
        'src/theme/**',
        'src/pages/**',
      ],
      rules: {
        'check-file/no-index': 'off',
      },
    },
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
            selector:
              'ImportDeclaration[source.value="src/nft/components/icons"], ImportDeclaration[source.value="nft/components/icons"]',
            message: 'Please import icons from nft/components/iconExports instead of directly from icons.tsx',
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
          {
            selector: `TSTypeAssertion[typeAnnotation.typeName.name='Address'], TSAsExpression[typeAnnotation.typeName.name='Address'], TSAsExpression[typeAnnotation.type='TSUnionType'] TSTypeReference[typeName.name='Address'], TSTypeAssertion[typeAnnotation.type='TSUnionType'] TSTypeReference[typeName.name='Address']`,
            message:
              'Do not use type assertions with "<Address>". Use `assumeOxAddress` to treat a string as an address, or isAddress/getAddress from viem to validate a string as an Address.',
          },
        ],
      },
    },
    {
      files: ['**/*.e2e.test.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'CallExpression[callee.property.name="getByTestId"] > Literal',
            message:
              'Use TestID enum from uniswap/src/test/fixtures/testIDs instead of string literals with getByTestId (e.g. TestID.SwapSettings)',
          },
        ],
      },
    },
    {
      // Enforce anvil test separation - anvil tests must only be in *.anvil.e2e.test.ts files
      files: ['**/*.e2e.test.ts'],
      excludedFiles: ['**/*.anvil.e2e.test.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          // Block getTest({ withAnvil: true })
          {
            selector:
              'CallExpression[callee.name="getTest"] > ObjectExpression > Property[key.name="withAnvil"][value.value=true]',
            message:
              'Anvil tests must be in *.anvil.e2e.test.ts files. Move this test to a file with .anvil.e2e.test.ts extension.',
          },
          // Block anvil fixture usage (anvil.setErc20Balance, etc.)
          {
            selector: 'MemberExpression[object.name="anvil"]',
            message:
              'Anvil fixture usage must be in *.anvil.e2e.test.ts files. Move this test to a file with .anvil.e2e.test.ts extension.',
          },
        ],
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      excludedFiles: ['src/analytics/*'],
      rules: {},
    },
    {
      files: ['*.mts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
    },
  ],
}
