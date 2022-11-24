module.exports = {
  extends: '../.eslintrc.js',
  rules: {
    'no-console': 'off',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
}
