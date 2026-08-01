#!/usr/bin/env bun
/**
 * Scrubs stray newline characters from downloaded Crowdin translations.
 *
 * A newline (`\n`, `\r\n`, or a bare `\r`) in a translated string is "stray"
 * when the English source string for the same key contains no newline. Crowdin
 * occasionally introduces these,
 * and they break layouts at render time. For every stray newline: replace it
 * with a single space when it sits between two non-space characters, otherwise
 * delete it. Nothing else is changed — no reformatting, no other fixes.
 *
 * Korean/Japanese/Chinese locales (ko*, ja*, zh*) are skipped entirely — CJK
 * translators intentionally reflow text.
 *
 * Prints a summary of every change (locale + key).
 *
 * Usage:
 *   bun scripts/i18n-scrub-stray-newlines.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const LOCALES_DIR = 'packages/uniswap/src/i18n/locales'
const SOURCE_FILE = path.join(LOCALES_DIR, 'source', 'en-US.json')
const TRANSLATIONS_DIR = path.join(LOCALES_DIR, 'translations')

// CJK locales intentionally reflow text; never touch them.
const SKIPPED_LOCALES = /^(ko|ja|zh)/i

// Matches `\n` and `\r`; a `\r\n` pair is just two adjacent newline characters.
const NEWLINE = /[\n\r]/

function isNonSpace(char: string | undefined): boolean {
  return char !== undefined && !/\s/.test(char)
}

/**
 * Removes every newline (`\n` or `\r`) from `value`: a newline between two
 * non-space characters becomes a single space, any other newline is deleted.
 * A `\r\n` pair therefore collapses to a single space (or nothing) just like
 * a lone `\n`.
 */
function removeStrayNewlines(value: string): string {
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (char !== '\n' && char !== '\r') {
      out += char
      continue
    }
    if (isNonSpace(out[out.length - 1]) && isNonSpace(value[i + 1])) {
      out += ' '
    }
  }
  return out
}

function scrubTranslations(): string[] {
  const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8')) as Record<string, unknown>
  const changes: string[] = []

  for (const file of fs.readdirSync(TRANSLATIONS_DIR).sort()) {
    if (!file.endsWith('.json') || SKIPPED_LOCALES.test(file)) {
      continue
    }
    const filePath = path.join(TRANSLATIONS_DIR, file)
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>
    let modified = false

    for (const [key, value] of Object.entries(translations)) {
      if (typeof value !== 'string' || !NEWLINE.test(value)) {
        continue
      }
      const sourceValue = source[key]
      if (typeof sourceValue !== 'string' || NEWLINE.test(sourceValue)) {
        continue
      }
      translations[key] = removeStrayNewlines(value)
      modified = true
      changes.push(`${file}: ${key}`)
    }

    if (modified) {
      // Crowdin exports are exactly `JSON.stringify(obj, null, 2) + '\n'`, so
      // writing the same shape back leaves untouched keys byte-identical.
      fs.writeFileSync(filePath, `${JSON.stringify(translations, null, 2)}\n`)
    }
  }

  return changes
}

if (import.meta.main) {
  const changes = scrubTranslations()
  if (changes.length === 0) {
    console.log('No stray newlines found in translations.')
  } else {
    console.log(`Scrubbed stray newlines from ${changes.length} translation(s):`)
    for (const change of changes) {
      console.log(`  ${change}`)
    }
  }
}

export { removeStrayNewlines, scrubTranslations }
