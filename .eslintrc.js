/* eslint-env node */

require('@uniswap/eslint-config/load')

module.exports = {
  extends: '@uniswap/eslint-config/react',
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'zustand',
                importNames: ['default'],
                message: 'Default import from zustand is depracated. Use named import instead.',
              },
            ],
          },
        ],
      },
    },
  ],
}
