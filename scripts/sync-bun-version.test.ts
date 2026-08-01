/**
 * Run with `bun test scripts/sync-bun-version.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  checkShaPin,
  extractPinnedValues,
  parseOfficialSha256,
  readExpectedVersion,
  replacePinnedValues,
  SHA_PIN,
  VERSION_PINS,
} from './sync-bun-version'

const REPO_ROOT = join(import.meta.dir, '..')

describe('replacePinnedValues', () => {
  test('rewrites the runner preinstall pin and nothing else', () => {
    const input = '  NODE_VERSION="22.22.2"\n  BUN_VERSION="1.3.11"\n'
    const pattern = /(BUN_VERSION=")([^"]+)(")/g
    expect(replacePinnedValues(input, pattern, '9.9.9')).toBe('  NODE_VERSION="22.22.2"\n  BUN_VERSION="9.9.9"\n')
  })

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

describe('parseOfficialSha256', () => {
  const sha = 'a'.repeat(64)
  const shasums = `${'b'.repeat(64)}  bun-darwin-aarch64.zip\n${sha}  bun-linux-x64.zip\n`

  test('extracts the checksum for the requested artifact', () => {
    expect(parseOfficialSha256(shasums, 'bun-linux-x64.zip')).toBe(sha)
  })

  test('throws when the artifact is missing', () => {
    expect(() => parseOfficialSha256(shasums, 'bun-windows-x64.zip')).toThrow('bun-windows-x64.zip')
  })
})

describe('checkShaPin', () => {
  const sha = 'a'.repeat(64)
  const content = `  BUN_VERSION="1.3.14"\n  BUN_SHA256="${sha}"\n`

  test('passes structural validation when the official checksum fetch already failed', () => {
    expect(checkShaPin(content)).toEqual([])
  })

  test('passes when the pin matches the official checksum', () => {
    expect(checkShaPin(content, sha)).toEqual([])
  })

  test('catches a hand-edited pin that no longer matches the official checksum', () => {
    const problems = checkShaPin(content, 'b'.repeat(64))
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain(`pinned BUN_SHA256 ${sha}`)
  })

  test('catches a malformed pin', () => {
    expect(checkShaPin('  BUN_SHA256="deadbeef"\n')).toHaveLength(1)
  })

  test('catches a missing pin', () => {
    expect(checkShaPin('  BUN_VERSION="1.3.14"\n')).toHaveLength(1)
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

  test('runs-on.yml carries exactly one SHA256 pin', () => {
    const values = extractPinnedValues(readFileSync(join(REPO_ROOT, SHA_PIN.path), 'utf8'), SHA_PIN.pattern)
    expect(values).toHaveLength(1)
    expect(values[0]).toMatch(/^[0-9a-f]{64}$/)
  })
})
