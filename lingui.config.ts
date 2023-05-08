import { default as babelExtractor } from '@lingui/cli/api/extractors/babel'
import { createHash } from 'crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import * as path from 'path'
import * as pkgUp from 'pkg-up' // pkg-up is used by lingui, and is used here to match lingui's own extractors

/**
 * A custom caching extractor for CI.
 * Falls back to the babelExtractor in a non-CI (ie local) environment.
 * Caches a file's latest extracted content's hash, and skips re-extracting if it is already present in the cache.
 * In CI, re-extracting files takes over one minute, so this is a significant savings.
 */
const cachingExtractor: typeof babelExtractor = {
  match(filename: string) {
    return babelExtractor.match(filename)
  },
  extract(filename: string, code: string, ...options: unknown[]) {
    if (!process.env.CI) return babelExtractor.extract(filename, code, ...options)

    // This runs from node_modules/@lingui/conf, so we need to back out to the root.
    const pkg = pkgUp.sync()
    if (!pkg) throw new Error('No root found')
    const root = path.dirname(pkg)

    const filePath = path.join(root, filename)
    const file = readFileSync(filePath)
    const hash = createHash('sha256').update(file).digest('hex')

    const cacheRoot = path.join(root, 'node_modules/.cache/lingui')
    mkdirSync(cacheRoot, { recursive: true })
    const cachePath = path.join(cacheRoot, filename.replace(/\//g, '-'))

    // Only read from the cache if we're not performing a "clean" run, as a clean run must re-extract from all
    // files to ensure that obsolete messages are removed.
    if (!process.argv.includes('--clean')) {
      try {
        const cache = readFileSync(cachePath, 'utf8')
        if (cache === hash) return
      } catch (e) {
        // It should not be considered an error if there is no cache file.
      }
    }
    writeFileSync(cachePath, hash)

    return babelExtractor.extract(filename, code, ...options)
  },
}

const linguiConfig = {
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['<rootDir>/src/**/*.ts', '<rootDir>/src/**/*.tsx'],
      exclude: [
        '<rootDir>/src/**/*.d.ts',
        '<rootDir>/src/**/*.test.*',
        '<rootDir>/src/types/v3/**',
        '<rootDir>/src/abis/types/**',
        '<rootDir>/src/graphql/**/__generated__/**',
      ],
    },
  ],
  compileNamespace: 'cjs',
  fallbackLocales: {
    default: 'en-US',
  },
  format: 'po',
  formatOptions: {
    lineNumbers: false,
  },
  locales: [
    'af-ZA',
    'ar-SA',
    'ca-ES',
    'cs-CZ',
    'da-DK',
    'de-DE',
    'el-GR',
    'en-US',
    'es-ES',
    'fi-FI',
    'fr-FR',
    'he-IL',
    'hu-HU',
    'id-ID',
    'it-IT',
    'ja-JP',
    'ko-KR',
    'nl-NL',
    'no-NO',
    'pl-PL',
    'pt-BR',
    'pt-PT',
    'ro-RO',
    'ru-RU',
    'sr-SP',
    'sv-SE',
    'sw-TZ',
    'tr-TR',
    'uk-UA',
    'vi-VN',
    'zh-CN',
    'zh-TW',
    'pseudo',
  ],
  orderBy: 'messageId',
  rootDir: '.',
  runtimeConfigModule: ['@lingui/core', 'i18n'],
  sourceLocale: 'en-US',
  pseudoLocale: 'pseudo',
  extractors: [cachingExtractor],
}

export default linguiConfig
