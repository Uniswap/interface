module.exports = {
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['<rootDir>'],
      exclude: ['**/node_modules/**', '**/build/**'],
    },
  ],
  compileNamespace: 'cjs',
  fallbackLocales: {},
  format: 'po',
  locales: ['en'],
  orderBy: 'messageId',
  pseudoLocale: '',
  rootDir: '.',
  runtimeConfigModule: ['@lingui/core', 'i18n'],
  sourceLocale: 'en',
}
//locales: ['en', 'de', 'es-AR', 'es-US', 'it-IT', 'iw', 'ro', 'ru', 'vi', 'zh-CN', 'zh-TW'],
