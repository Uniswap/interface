module.exports = {
  root: true,
  extends: ['custom'],
  ignorePatterns: [
    'node_modules',
    '.turbo',
    'dist',
    'types',
    '.eslintrc.js',
    '**/*.test.tsx',
    'jest.config.js',
    'babel.config.js',
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

    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-restricted-imports': [
          2,
          {
            paths: [
              {
                name: 'ui/src',
                message:
                  'Avoid importing directly from ui/src from within the ui package which causes circular imports.',
              },
            ],
          },
        ],
      },
    },
  ],
  rules: {},
};
