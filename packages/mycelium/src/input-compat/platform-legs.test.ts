/**
 * Platform-leg contract for the Input compat (INFRA-3600), following
 * `anchor-compat/platform-legs.test.ts`.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo, so
 * `tsc` only ever resolves the BASE leg — a `.native` leg cannot carry a
 * different type, and nothing in the typechecker notices if it exports a
 * different symbol set. A bundler that resolved the native leg would then hit a
 * missing export at runtime. The base leg is a 1-line re-export of the web leg,
 * so base ≡ web is a structural given; base ≡ native is what this suite proves.
 */
import { describe, expect, it, vi } from 'vitest'
// Explicit .tsx extension: this vitest config resolves `.web.*` first, which
// would silently swap the platformless base leg for the web leg here.
import * as base from './InputCompat.tsx'
import * as web from './InputCompat.web'

// The native leg imports react-native (Flow sources this jsdom config cannot
// parse); the mock supplies the hosts plus TextInput and useWindowDimensions.
vi.mock('react-native', () => import('./testing/react-native-mock'))

describe('base leg re-exports the web leg', () => {
  it('InputCompat', () => {
    expect(base.InputCompat).toBe(web.InputCompat)
  })
})

describe('export parity across the legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('./InputCompat.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native)).toContain('InputCompat')
  })

  it('both legs are real components, not stubs', async () => {
    const native = await import('./InputCompat.native')
    for (const leg of [web.InputCompat, native.InputCompat]) {
      expect(typeof leg).toBe('object') // forwardRef exotic component
      expect(leg).toHaveProperty('render')
    }
  })

  it('the native leg is NOT the web leg (a real split, not an accidental alias)', async () => {
    const native = await import('./InputCompat.native')
    expect(native.InputCompat).not.toBe(web.InputCompat)
  })

  it('the font-token legs export the same symbol set', async () => {
    const webFonts = await import('./font-tokens.web')
    const nativeFonts = await import('./font-tokens.native')
    expect(Object.keys(nativeFonts).sort()).toEqual(Object.keys(webFonts).sort())
  })

  it('the breakpoint-hook legs export the same symbol set', async () => {
    const webHooks = await import('./breakpoints.web')
    const nativeHooks = await import('./breakpoints.native')
    expect(Object.keys(nativeHooks).sort()).toEqual(Object.keys(webHooks).sort())
  })
})
