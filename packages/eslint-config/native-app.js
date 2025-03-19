module.exports = {
  extends: [require.resolve('./native.js')],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      excludedFiles: [
        '*.android.*',
        '*.ios.*',
        '*.native.*',
        '*.web.*',
        '*.mock.*',
        '**/RNEthersRs.ts',
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
