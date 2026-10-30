/**
 * Platform-leg contract for the SpinningLoader compat (INFRA-3644), following
 * `checkbox-compat/platform-legs.test.ts`.
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
import * as base from './SpinningLoaderCompat.tsx'
import * as web from './SpinningLoaderCompat.web'

// The native leg's dependency closure resolves untranspiled RN-flavored
// sources under this jsdom config — serve the button-compat stand-ins instead
// (the button-frame-compat precedent). The real modules are exercised by the
// packages/tailwind native parity harness.
vi.mock('react-native', () => import('../button-compat/testing/native-mocks'))
vi.mock('react-native-reanimated', () => import('../button-compat/testing/reanimated-mock'))
vi.mock('react-native-svg', () => import('../button-compat/testing/react-native-svg-mock'))

describe('base leg re-exports the web leg', () => {
  it('SpinningLoaderCompat', () => {
    expect(base.SpinningLoaderCompat).toBe(web.SpinningLoaderCompat)
  })
})

describe('export parity across the legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('./SpinningLoaderCompat.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native)).toContain('SpinningLoaderCompat')
  })

  it('both legs are real components, not stubs', async () => {
    const native = await import('./SpinningLoaderCompat.native')
    for (const leg of [web.SpinningLoaderCompat, native.SpinningLoaderCompat]) {
      expect(typeof leg).toBe('function')
    }
  })

  it('the native leg is NOT the web leg (a real split, not an accidental alias)', async () => {
    const native = await import('./SpinningLoaderCompat.native')
    expect(native.SpinningLoaderCompat).not.toBe(web.SpinningLoaderCompat)
  })
})
