module.exports = {
  // Key separator used in your translation keys
  contextSeparator: '_',

  // Save the \_old files
  createOldCatalogs: true,

  defaultNamespace: 'translation',

  // Default value to give to empty keys
  // You may also specify a function accepting the locale, namespace, and key as arguments
  defaultValue: '',

  // Indentation of the catalog files
  indentation: 2,

  // Keep keys from the catalog that are no longer in code
  keepRemoved: false,

  // Key separator used in your translation keys
  keySeparator: false,

  // see below for more details
  lexers: {
    hbs: ['HandlebarsLexer'],
    handlebars: ['HandlebarsLexer'],

    htm: ['HTMLLexer'],
    html: ['HTMLLexer'],

    mjs: ['JavascriptLexer'],
    js: ['JavascriptLexer'], // if you're writing jsx inside .js files, change this to JsxLexer
    ts: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    tsx: ['JsxLexer'],

    default: ['JavascriptLexer'],
  },

  // Control the line ending. See options at https://github.com/ryanve/eol
  lineEnding: 'auto',

  // An array of the locales in your applications
  locales: ['en-US'],

  // Namespace separator used in your translation keys
  // Disabling instead of default ':' so we can use plain english keys
  namespaceSeparator: false,

  // Supports $LOCALE and $NAMESPACE injection
  // Supports JSON (.json) and YAML (.yml) file formats
  // Where to write the locale files relative to process.cwd()
  output: 'packages/uniswap/src/i18n/locales/source/en-US.json',

  // Plural separator used in your translation keys
  // If you want to use plain english keys, separators such as `_` might conflict. You might want to set `pluralSeparator` to a different string that does not occur in your keys.
  pluralSeparator: '_',

  // An array of globs that describe where to look for source files
  // relative to the location of the configuration file
  input: ['apps/**/*.tsx', 'apps/**/*.ts', 'packages/**/*.ts', 'packages/**/*.tsx'],

  // Whether or not to sort the catalog. Can also be a [compareFunction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#parameters)
  sort: true,

  // Display info about the parsing including some stats
  verbose: false,

  // Exit with an exit code of 1 on warnings
  failOnWarnings: false,

  // If you wish to customize the value output the value as an object, you can set your own format.
  // ${defaultValue} is the default value you set in your translation function.
  // Any other custom property will be automatically extracted.
  //
  // Example:
  // {
  //   message: "${defaultValue}",
  //   description: "${maxLength}", // t('my-key', {maxLength: 150})
  // }
  customValueTemplate: null,
}
