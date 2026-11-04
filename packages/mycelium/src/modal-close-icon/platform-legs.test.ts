/**
 * Platform-leg contract for the ModalCloseIcon compat (INFRA-3282), following
 * `checkbox-compat/platform-legs.test.ts`.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo, so
 * `tsc` only ever resolves the BASE leg — a `.native` leg cannot carry a
 * different type, and nothing in the typechecker notices if it exports a
 * different symbol set. A bundler that resolved the native leg would then hit a
 * missing export at runtime. The base leg is a 1-line re-export of the web leg
 * (the `TouchableAreaCompat.tsx` mechanism), so base ≡ web is a structural
 * given; base ≡ native is what this suite proves.
 */
import { describe, expect, it, vi } from 'vitest'
// Explicit .tsx extension: this vitest config resolves `.web.*` first, which
// would silently swap the platformless base leg for the web leg here.
import * as base from './ModalCloseIconCompat.tsx'
import * as web from './ModalCloseIconCompat.web'

// The native leg imports react-native-svg, whose real CJS build requires
// react-native's flow sources; the real module is exercised on device, not
// under this jsdom config.
vi.mock('react-native-svg', () => import('./testing/react-native-svg-mock'))

describe('base leg re-exports the web leg', () => {
  it('ModalCloseIconCompat', () => {
    expect(base.ModalCloseIconCompat).toBe(web.ModalCloseIconCompat)
  })
})

describe('export parity across the legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('./ModalCloseIconCompat.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native)).toContain('ModalCloseIconCompat')
  })

  it('both legs are real function components, not stubs', async () => {
    const native = await import('./ModalCloseIconCompat.native')
    for (const leg of [web.ModalCloseIconCompat, native.ModalCloseIconCompat]) {
      expect(typeof leg).toBe('function')
    }
  })

  it('the native leg is NOT the web leg (a real split, not an accidental alias)', async () => {
    const native = await import('./ModalCloseIconCompat.native')
    expect(native.ModalCloseIconCompat).not.toBe(web.ModalCloseIconCompat)
  })
})

describe('the subpath barrel resolves every symbol', () => {
  it('exports the component plus the shared contract', async () => {
    const barrel = await import('./index')
    expect(barrel.ModalCloseIconCompat).toBe(web.ModalCloseIconCompat)
    expect(barrel.closeIconSizePx('$icon.24')).toBe(24)
    expect(barrel.DEFAULT_CLOSE_ICON_HOVER_COLOR).toBe('$neutral2Hovered')
  })
})
