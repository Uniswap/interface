const rulesDirPlugin = require('eslint-plugin-rulesdir')
rulesDirPlugin.RULES_DIR = '../../packages/uniswap/eslint_rules'

module.exports = {
  root: true,
  extends: ['@uniswap/eslint-config/mobile'],
  plugins: ['rulesdir'],
  ignorePatterns: [
    '.storybook/storybook.requires.ts',
    '!.maestro', // Don't ignore .maestro directory
    '!.maestro/**', // Don't ignore files in .maestro
  ],
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['index.js', 'src/index.ts', 'src/polyfills/index.ts', 'src/test/fixtures/*'],
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
            prefix: 'src',
          },
        ],
      },
    },
    {
      files: ['.maestro/scripts/**/*.ts'],
      rules: {
        // Maestro scripts have different import requirements
        'no-relative-import-paths/no-relative-import-paths': 'off',
        // Allow console.log for Maestro scripts (needed for metrics output)
        'no-console': 'off',
        // These scripts run in GraalJS environment, not React Native
        'react-native/no-unused-styles': 'off',
        'react-native/no-color-literals': 'off',
        // Triple-slash references are needed for globals in Maestro environment
        '@typescript-eslint/triple-slash-reference': 'off',
        // Don't require React in scope for these non-React files
        'react/react-in-jsx-scope': 'off',
        // Allow any for error handling in compile script
        '@typescript-eslint/no-explicit-any': 'warn',
        // These are utility modules that may not all be used immediately
        'import/no-unused-modules': 'off',
      },
    },
  ],
  rules: {
    'rulesdir/i18n': 'error',
    'rulesdir/no-redux-modals': 'error',
  },
}
