/**
 * Platform-leg contract for `DropdownMenuSheetItemCompat`, following
 * `animated-flex-compat/platform-legs.test.ts`: tsc only resolves the base leg,
 * so this pins that the base throws and that every leg exports the same symbols.
 */
import { PlatformSplitStubError } from '@universe/environment'
import { describe, expect, it, vi } from 'vitest'
// Explicit .tsx extension: this vitest config resolves `.web.*` first, which
// would silently swap the platformless base leg for the web leg here.
import * as base from './DropdownMenuSheetItemCompat.tsx'
import * as web from './DropdownMenuSheetItemCompat.web'

vi.mock('react-native', () => import('../button-compat/testing/native-mocks'))

type ForwardRefLike = { render: (props: unknown, ref: unknown) => unknown }

describe('base leg is the throwing platform stub', () => {
  it('throws PlatformSplitStubError when rendered', () => {
    const render = (base.DropdownMenuSheetItemCompat as unknown as ForwardRefLike).render
    expect(() => render({}, null)).toThrowError(PlatformSplitStubError)
  })
})

describe('export parity across the legs', () => {
  it('web and native legs export exactly the base leg symbol set', async () => {
    const native = await import('./DropdownMenuSheetItemCompat.native')
    const baseKeys = Object.keys(base).sort()
    expect(baseKeys).toEqual(['DropdownMenuSheetItemCompat'])
    expect(Object.keys(web).sort()).toEqual(baseKeys)
    expect(Object.keys(native).sort()).toEqual(baseKeys)
  })

  it('the web and native legs are real components, distinct from the base stub and each other', async () => {
    const native = await import('./DropdownMenuSheetItemCompat.native')
    expect(web.DropdownMenuSheetItemCompat).not.toBe(base.DropdownMenuSheetItemCompat)
    expect(native.DropdownMenuSheetItemCompat).not.toBe(base.DropdownMenuSheetItemCompat)
    expect(native.DropdownMenuSheetItemCompat).not.toBe(web.DropdownMenuSheetItemCompat)
  })
})

describe('the subpath barrel resolves every symbol', () => {
  it('exports the component (web leg under this config)', async () => {
    const barrel = await import('./index')
    expect(barrel.DropdownMenuSheetItemCompat).toBe(web.DropdownMenuSheetItemCompat)
  })
})
