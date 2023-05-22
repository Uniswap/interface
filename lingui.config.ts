/* eslint-env node */
import { default as babelExtractor } from '@lingui/cli/api/extractors/babel'
import { createHash } from 'crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { existsSync } from 'fs'
import * as path from 'path'

/** A custom caching extractor. */
const cachingExtractor: typeof babelExtractor = {
  match(filename: string) {
    return babelExtractor.match(filename)
  },
  /**
   * Stores a hash of a file and its corresponding catalog, to be re-used if the hash is unchanged.
   * @lingui/babel-plugin-extract-messages extracts to localeDir, so if the messages are unchanged for filename, it is
   * valid to copy over the last-generated file.
   */
  extract(filename: string, localeDir: string, ...options: unknown[]) {
    // This runs from node_modules/@lingui/conf, so we need to back out to the root.
    const root = __dirname.split('/node_modules')[0]

    // localePath is copied catalogFilename from @lingui/babel-plugin-extract-messages.
    const localePath = path.join(localeDir, '_build', filename + '.json')

    const cacheRoot = path.join(root, 'node_modules/.cache/lingui')
    const cachePath = path.join(cacheRoot, filename + '.json')

    const filePath = path.join(root, filename)
    const fileHash = createHash('sha256').update(readFileSync(filePath)).digest('hex')

    // If we have a matching cached copy of the catalog, we can copy it over and return early.
    if (existsSync(cachePath)) {
      const { hash, catalog } = JSON.parse(readFileSync(cachePath, 'utf8'))
      if (hash === fileHash) {
        if (catalog) {
          mkdirSync(path.dirname(localePath), { recursive: true })
          writeFileSync(localePath, JSON.stringify(catalog, null, 2))
        }
        return
      }
    }

    babelExtractor.extract(filename, localeDir, ...options)

    mkdirSync(path.dirname(cachePath), { recursive: true })
    if (existsSync(localePath)) {
      const catalog = JSON.parse(readFileSync(localePath, 'utf8'))
      writeFileSync(cachePath, JSON.stringify({ hash: fileHash, catalog }))
    } else {
      writeFileSync(cachePath, JSON.stringify({ hash: fileHash }))
    }
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
