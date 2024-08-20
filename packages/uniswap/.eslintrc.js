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
  rules: {
    "import/no-unused-modules": [
      "warn",
      {
        "unusedExports": true,
        "ignoreExports": ["**/*.test.js", "**/*.test.ts", "**/*.test.tsx"]
      }
    ]
  },
}
