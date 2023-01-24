module.exports = {
  overrides: [
    {
      files: "*.sol",
      options: {
        bracketSpacing: false,
        printWidth: 145,
        tabWidth: 4,
        useTabs: false,
        singleQuote: false,
        explicitTypes: "always",
      },
    },
    {
      files: "*.js",
      options: {
        printWidth: 145,
        semi: true,
        tabWidth: 2,
        trailingComma: "es5",
      },
    },
  ],
}