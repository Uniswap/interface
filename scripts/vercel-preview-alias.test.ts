/**
 * Test file for the vercel-preview-alias script
 * Run with `bun test scripts/vercel-preview-alias.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import { aliasForBranch } from './vercel-preview-alias'

const MAX_LABEL = 63

function label(alias: string): string {
  return alias.replace(/\.vercel\.app$/, '')
}

describe('aliasForBranch', () => {
  test('always produces a `-uniswap.vercel.app` host', () => {
    for (const branch of ['main', 'feat/Foo_Bar', 'release/1.2.3', 'a', 'UPPER', 'x'.repeat(200)]) {
      expect(aliasForBranch(branch).endsWith('-uniswap.vercel.app')).toBe(true)
    }
  })

  test('sanitizes case and non-alphanumerics into dashes', () => {
    expect(aliasForBranch('feat/Foo_Bar')).toBe('web-feat-foo-bar-uniswap.vercel.app')
  })

  test('collapses runs of separators and trims leading/trailing ones', () => {
    expect(aliasForBranch('--feat///Foo___Bar--')).toBe('web-feat-foo-bar-uniswap.vercel.app')
  })

  test('is deterministic for the same branch', () => {
    expect(aliasForBranch('feature/some-branch')).toBe(aliasForBranch('feature/some-branch'))
  })

  test('keeps the label within the 63-char DNS limit when truncating', () => {
    const longBranch = `feature/${'segment-'.repeat(20)}end`
    const alias = aliasForBranch(longBranch)

    expect(label(alias).length).toBeLessThanOrEqual(MAX_LABEL)
    expect(alias.startsWith('web-')).toBe(true)
    expect(alias.endsWith('-uniswap.vercel.app')).toBe(true)
  })

  test('appends a stable hash so distinct long branches do not collide', () => {
    const base = `feature/${'x'.repeat(100)}`
    const aliasA = aliasForBranch(`${base}-alpha`)
    const aliasB = aliasForBranch(`${base}-beta`)

    // Same truncated prefix, but the hash keeps them distinct.
    expect(aliasA).not.toBe(aliasB)
    expect(label(aliasA).length).toBeLessThanOrEqual(MAX_LABEL)
    expect(label(aliasB).length).toBeLessThanOrEqual(MAX_LABEL)
  })

  test('does not leave a trailing dash before the hash when truncating', () => {
    // A branch whose truncation boundary lands on a separator should not yield `--<hash>`.
    const alias = aliasForBranch(`feat/${'word-'.repeat(30)}`)
    expect(alias).not.toMatch(/--[0-9a-f]{6}-uniswap\.vercel\.app$/)
  })
})
