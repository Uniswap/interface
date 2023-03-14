module.exports = {
  root: true,
  extends: ['custom'],
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
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {},
    },
    {
      files: ['*.js', '*.jsx'],
      rules: {},
    },
  ],
  rules: {},
}
