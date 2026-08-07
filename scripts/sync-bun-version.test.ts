/**
 * Run with `bun test scripts/sync-bun-version.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractPinnedValues, readExpectedVersion, replacePinnedValues, VERSION_PINS } from './sync-bun-version'

const REPO_ROOT = join(import.meta.dir, '..')

describe('replacePinnedValues', () => {
  test('rewrites every EAS profile pin but leaves node pins alone', () => {
    const input = '"bun": "1.3.11",\n"node": "22.22.2",\n"bun": "1.3.11",\n'
    const pattern = /("bun": ")(\d+\.\d+\.\d+)(")/g
    expect(replacePinnedValues(input, pattern, '9.9.9')).toBe('"bun": "9.9.9",\n"node": "22.22.2",\n"bun": "9.9.9",\n')
  })

  test('preserves the >= range operator in engines pins', () => {
    const input = '"engines": { "bun": ">=1.3.11", "npm": "please-use-bun" }'
    const pattern = /("bun": ">=)([^"]+)(")/g
    expect(replacePinnedValues(input, pattern, '9.9.9')).toBe(
      '"engines": { "bun": ">=9.9.9", "npm": "please-use-bun" }',
    )
  })
})

describe('repo pins', () => {
  const version = readExpectedVersion()

  test.each(VERSION_PINS.map((pin) => [pin.path, pin.pattern] as const))(
    '%s pins match .bun-version',
    (path, pattern) => {
      const values = extractPinnedValues(readFileSync(join(REPO_ROOT, path), 'utf8'), pattern)
      expect(values.length).toBeGreaterThan(0)
      for (const value of values) {
        expect(value).toBe(version)
      }
    },
  )
})
