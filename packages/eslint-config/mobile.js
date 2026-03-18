const biomeSupportedRules = require('./biome-supported')

module.exports = {
  extends: [require.resolve('./native.js')],
  rules: {
    // Disable all ESLint rules that have been migrated to Biome
    ...biomeSupportedRules,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: [
        '*.android.*',
        '*.ios.*',
        '*.native.*',
        '*.web.*',
        '*.mock.*',
        '**/ReactotronConfig.ts',
        '**/__mocks__/**',
        '*.d.ts',
      ],
      rules: {
        'import/no-unused-modules': ['error', { unusedExports: true }],
      },
    },
  ],
}
