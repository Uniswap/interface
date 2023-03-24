module.exports = {
  root: true,
  extends: ['universe/native', 'custom'],
  ignorePatterns: [
    'node_modules',
    '.expo',
    '.turbo',
    'ios',
    'assets',
    'dist',
    '.eslintrc.js',
    'babel.config.js',
    'metro.config.js',
  ],
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
