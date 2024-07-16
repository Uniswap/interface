module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/native'],
  ignorePatterns: ['node_modules', 'dist', '.turbo', 'build', '.eslintrc.js', 'webpack.config.js', 'webpack.dev.config.js', 'manifest.json'],
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
          },
        ],
      },
    },
  ],
  rules: {},
}
