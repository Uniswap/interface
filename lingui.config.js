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
    default: 'en',
  },
  format: 'po',
  locales: ['en', 'pseudo-en', 'de', 'en', 'es-AR', 'es-US', 'it-IT', 'iw', 'ro', 'ru', 'vi', 'zh-CN', 'zh-TW'],
  orderBy: 'messageId',
  pseudoLocale: 'pseudo-en',
  rootDir: '.',
  runtimeConfigModule: ['@lingui/core', 'i18n'],
  sourceLocale: 'en',
}
