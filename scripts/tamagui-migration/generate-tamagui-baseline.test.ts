/**
 * Run with `bun test scripts/tamagui-migration/generate-tamagui-baseline.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import {
  buildBaselineFiles,
  classifyMessage,
  renderBaseline,
  toExemptIgnorePatterns,
  toRepoRelativePath,
} from './generate-tamagui-baseline'

const STYLED_MESSAGE = 'New Tamagui styled() calls are banned (Tamagui → Tailwind migration).'
const ANIMATION_MESSAGE = 'New Tamagui animation preset prop "animation" is banned.'
const GROUP_MESSAGE = 'New Tamagui $group-* prop "$group-hover" is banned.'

describe('classifyMessage', () => {
  test('maps each rule message to its category', () => {
    expect(classifyMessage(STYLED_MESSAGE)).toBe('styled')
    expect(classifyMessage(ANIMATION_MESSAGE)).toBe('animation')
    expect(classifyMessage(GROUP_MESSAGE)).toBe('group')
  })

  test('returns undefined for unrelated diagnostics', () => {
    expect(classifyMessage('Unexpected console statement.')).toBeUndefined()
  })
})

describe('toRepoRelativePath', () => {
  test('strips the repo root prefix', () => {
    expect(toRepoRelativePath('/repo/apps/web/src/App.tsx', '/repo')).toBe('apps/web/src/App.tsx')
  })

  test('leaves paths outside the root untouched', () => {
    expect(toRepoRelativePath('/elsewhere/App.tsx', '/repo')).toBe('/elsewhere/App.tsx')
  })
})

describe('toExemptIgnorePatterns', () => {
  test('emits recursive globs with a directory boundary, with or without trailing slash', () => {
    expect(toExemptIgnorePatterns(['scripts/tamagui-migration/', 'scripts/tamagui-census'])).toEqual([
      'scripts/tamagui-migration/**',
      'scripts/tamagui-census/**',
    ])
  })
})

describe('buildBaselineFiles', () => {
  test('folds diagnostics into sorted per-file category counts', () => {
    const files = buildBaselineFiles(
      [
        { filename: '/repo/b.tsx', message: STYLED_MESSAGE },
        { filename: '/repo/a.tsx', message: GROUP_MESSAGE },
        { filename: '/repo/b.tsx', message: STYLED_MESSAGE },
        { filename: '/repo/b.tsx', message: ANIMATION_MESSAGE },
        { filename: '/repo/b.tsx', message: 'Unrelated diagnostic.' },
      ],
      '/repo',
    )
    expect(Object.keys(files)).toEqual(['a.tsx', 'b.tsx'])
    expect(files['a.tsx']).toEqual({ group: 1 })
    expect(files['b.tsx']).toEqual({ styled: 2, animation: 1 })
  })
})

describe('renderBaseline', () => {
  test('renders totals and files with a trailing newline', () => {
    const rendered = renderBaseline({ 'a.tsx': { styled: 2, group: 1 } })
    const parsed = JSON.parse(rendered)
    expect(parsed.totals).toEqual({ styled: 2, animation: 0, group: 1, files: 1 })
    expect(parsed.files['a.tsx']).toEqual({ styled: 2, group: 1 })
    expect(rendered.endsWith('\n')).toBe(true)
  })
})
