module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native', '@uniswap/eslint-config/webPlatform'],
  ignorePatterns: [
    'node_modules',
    '.turbo',
    '.eslintrc.js',
    'vitest.config.ts',
    'codegen.ts',
    '.nx',
    'scripts',
    'dist',
    'src/**/__generated__',
  ],
  parserOptions: {
    project: 'tsconfig.lint.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['src/index.ts'],
      rules: {
        'check-file/no-index': 'off',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
            prefix: '@universe/cli',
          },
        ],
      },
    },
  ],
  rules: {},
}
