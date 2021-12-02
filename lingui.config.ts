export default {
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['<rootDir>/src']
    }
  ],
  compileNamespace: 'cjs',
  fallbackLocales: {
    default: 'en-US'
  },
  format: 'po',
  formatOptions: {
    lineNumbers: false
  },
  locales: ['en-US', 'ko-KR', 'tr-TR', 'vi-VN', 'zh-CN', 'tl-PH'],
  orderBy: 'messageId',
  rootDir: '.',
  runtimeConfigModule: ['@lingui/core', 'i18n'],
  sourceLocale: 'en-US'
}
