module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native', '@uniswap/eslint-config/crossPlatform'],
  ignorePatterns: ['node_modules', '.turbo', '.eslintrc.js', 'codegen.ts'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-relative-import-paths/no-relative-import-paths': [
          'error',
          {
            allowSameFolder: false,
            prefix: 'uniswap',
          },
        ],
      },
    },
  ],
  rules: {},
}
