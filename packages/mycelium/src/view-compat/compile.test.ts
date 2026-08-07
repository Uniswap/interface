/**
 * Unit coverage for the shared `insetClasses` helper through both compilers.
 * The object forms are compat-superset-only: the plain Tamagui `View` neither
 * types nor renders object `inset` on web (it stringifies to
 * `inset:[object Object]`), so they are pinned here rather than in the
 * `packages/tailwind` parity matrix, which diffs against the real Tamagui View.
 */
import { describe, expect, it } from 'vitest'
import { flexCompatClassName } from '../flex-compat/compile'
import { viewCompatClassName } from './compile'

const has = (className: string, cls: string): boolean => className.split(' ').includes(cls)

describe('viewCompatClassName — inset', () => {
  it('partial object emits only the given longhands', () => {
    const className = viewCompatClassName({ inset: { top: 4, left: 8 } })
    expect(has(className, 'top-[4px]')).toBe(true)
    expect(has(className, 'left-[8px]')).toBe(true)
    expect(className).not.toContain('right-[')
    expect(className).not.toContain('bottom-[')
  })

  it('full object emits all four longhands', () => {
    const className = viewCompatClassName({ inset: { top: 1, right: 2, bottom: 3, left: 4 } })
    expect(has(className, 'top-[1px]')).toBe(true)
    expect(has(className, 'right-[2px]')).toBe(true)
    expect(has(className, 'bottom-[3px]')).toBe(true)
    expect(has(className, 'left-[4px]')).toBe(true)
  })

  it('scalar expands to all four longhands (number and token)', () => {
    const numeric = viewCompatClassName({ inset: 8 })
    for (const cls of ['top-[8px]', 'right-[8px]', 'bottom-[8px]', 'left-[8px]']) {
      expect(has(numeric, cls)).toBe(true)
    }
    const token = viewCompatClassName({ inset: '$spacing16' })
    for (const cls of ['top-[16px]', 'right-[16px]', 'bottom-[16px]', 'left-[16px]']) {
      expect(has(token, cls)).toBe(true)
    }
  })

  it('compiles identically through the Flex binding (shared helper)', () => {
    const inset = { top: 4, left: 8 }
    expect(viewCompatClassName({ inset })).toBe(flexCompatClassName({ inset }))
  })
})
