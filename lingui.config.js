module.exports = {
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['<rootDir>'],
      exclude: ['**/node_modules/**', '**/build/**'],
    },
  ],
  compileNamespace: 'cjs',
  fallbackLocales: {
    'pseudo-en': 'en',
  },
  format: 'po',
  locales: ['en', 'pseudo-en'],
  orderBy: 'messageId',
  pseudoLocale: 'pseudo-en',
  rootDir: '.',
  runtimeConfigModule: ['@lingui/core', 'i18n'],
  sourceLocale: 'en',
}
