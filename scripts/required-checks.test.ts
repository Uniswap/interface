/**
 * Run with `bun test scripts/required-checks.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import { globToRegExp, loadBranches, matchBranch } from './required-checks'

const FIXTURE = {
  main: { requiredChecks: ['integrity', 'unit-tests'] },
  'releases/mobile/**': { requiredChecks: ['mobile-build'] },
  'releases/mobile/dev': { requiredChecks: ['code-quality'] },
}

describe('globToRegExp', () => {
  test('** spans path segments', () => {
    expect(globToRegExp('releases/mobile/**').test('releases/mobile/1.50')).toBe(true)
    expect(globToRegExp('releases/mobile/**').test('releases/mobile/hotfix/1.50')).toBe(true)
    expect(globToRegExp('releases/mobile/**').test('releases/extension/1.50')).toBe(false)
  })

  test('* stays within one path segment', () => {
    expect(globToRegExp('releases/*').test('releases/mobile')).toBe(true)
    expect(globToRegExp('releases/*').test('releases/mobile/1.50')).toBe(false)
  })

  test('literal patterns match only themselves (dots are not wildcards)', () => {
    expect(globToRegExp('main').test('main')).toBe(true)
    expect(globToRegExp('main').test('domain')).toBe(false)
    expect(globToRegExp('v1.2').test('v1x2')).toBe(false)
  })
})

describe('matchBranch', () => {
  test('exact key match wins over a glob that also matches', () => {
    expect(matchBranch('releases/mobile/dev', FIXTURE)).toEqual({
      matched: 'releases/mobile/dev',
      requiredChecks: ['code-quality'],
    })
  })

  test('glob match when no exact key exists', () => {
    expect(matchBranch('releases/mobile/1.50', FIXTURE)).toEqual({
      matched: 'releases/mobile/**',
      requiredChecks: ['mobile-build'],
    })
  })

  test('exact match on a literal key', () => {
    expect(matchBranch('main', FIXTURE)).toEqual({ matched: 'main', requiredChecks: ['integrity', 'unit-tests'] })
  })

  test('no match returns null (callers fall back to requiring everything)', () => {
    expect(matchBranch('ci/orchestrator-00-base', FIXTURE)).toEqual({ matched: null, requiredChecks: [] })
    expect(matchBranch('feature/my-change', FIXTURE)).toEqual({ matched: null, requiredChecks: [] })
  })

  test('most specific glob (longest literal prefix) wins', () => {
    const branches = {
      'releases/**': { requiredChecks: ['integrity'] },
      'releases/mobile/**': { requiredChecks: ['mobile-build'] },
    }
    expect(matchBranch('releases/mobile/1.50', branches).matched).toBe('releases/mobile/**')
    expect(matchBranch('releases/extension/1.50', branches).matched).toBe('releases/**')
  })
})

describe('repo ci-checks.json', () => {
  const branches = loadBranches()

  test('main requires the orchestrator caller jobs', () => {
    expect(matchBranch('main', branches).requiredChecks).toEqual([
      'integrity',
      'storybook',
      'web-smoketest',
      'mobile-build',
      'web-quality',
      'unit-tests',
      'code-quality',
    ])
  })

  test('mobile release branches resolve via the glob, dev via its exact key', () => {
    expect(matchBranch('releases/mobile/1.50', branches).matched).toBe('releases/mobile/**')
    expect(matchBranch('releases/mobile/dev', branches).matched).toBe('releases/mobile/dev')
    expect(matchBranch('releases/mobile/1.50', branches).requiredChecks).toEqual([
      'integrity',
      'mobile-build',
      'unit-tests',
      'code-quality',
    ])
  })

  test('extension release branches never require mobile-build', () => {
    expect(matchBranch('releases/extension/1.50', branches).requiredChecks).not.toContain('mobile-build')
  })

  test('web release branches require smoketest and code quality', () => {
    expect(matchBranch('web/production', branches).requiredChecks).toEqual(['web-smoketest', 'code-quality'])
    expect(matchBranch('web/staging', branches).requiredChecks).toEqual(['web-smoketest', 'code-quality'])
  })

  test('mirror branches require no checks', () => {
    expect(matchBranch('interface/mirror/web', branches).requiredChecks).toEqual([])
    expect(matchBranch('interface/mirror/wallet', branches).requiredChecks).toEqual([])
  })

  test('every requiredChecks entry is a ci.yml top-level job id (no legacy context names)', () => {
    for (const rule of Object.values(branches)) {
      for (const check of rule.requiredChecks) {
        // Job ids are lowercase kebab-case; legacy contexts had spaces/uppercase.
        expect(check).toMatch(/^[a-z0-9-]+$/)
      }
    }
  })

  test('stacked and feature branches match no entry', () => {
    expect(matchBranch('ci/orchestrator-10-cleanup', branches).matched).toBeNull()
    expect(matchBranch('gtmq-0128-abcdef', branches).matched).toBeNull()
  })
})
