/**
 * Platform-leg contract for the RefreshButton compat (INFRA-3489), following
 * `modal-close-icon/platform-legs.test.ts` / `checkbox-compat`.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo,
 * so `tsc` only ever resolves the BASE leg — a `.native` leg cannot carry a
 * different type, and nothing in the typechecker notices if it exports a
 * different symbol set. A bundler that resolved the native leg would then hit
 * a missing export at runtime. Unlike the modal-close-icon (real native leg),
 * this compat's base and native legs are BOTH deliberate throwing stubs — the
 * base because a platform override must always resolve, the native because
 * the native leg is deferred (the sole consumer web-guards the render) — so
 * this suite additionally pins that both stubs throw loudly instead of
 * rendering nothing.
 */
import { describe, expect, it } from 'vitest'
import type { RefreshButtonCompatProps } from './props'
import * as native from './RefreshButtonCompat.native'
// Explicit .tsx extension: this vitest config resolves `.web.*` first, which
// would silently swap the platformless base leg for the web leg here.
import * as base from './RefreshButtonCompat.tsx'
import * as web from './RefreshButtonCompat.web'

const PROPS: RefreshButtonCompatProps = {
  onPress: () => undefined,
  isLoading: false,
  tooltipLabel: 'Refresh',
}

describe('export parity across the legs', () => {
  it('all three legs export exactly the same symbol set', () => {
    expect(Object.keys(web).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(web)).toContain('RefreshButtonCompat')
  })

  it('the web leg is a real component; base and native are distinct stubs', () => {
    for (const leg of [web, base, native]) {
      expect(typeof leg.RefreshButtonCompat).toBe('function')
    }
    expect(native.RefreshButtonCompat).not.toBe(web.RefreshButtonCompat)
    expect(base.RefreshButtonCompat).not.toBe(web.RefreshButtonCompat)
  })

  it('the base stub throws loudly (platform override must resolve)', () => {
    expect(() => base.RefreshButtonCompat(PROPS)).toThrow(/platform override/)
  })

  it('the native stub throws loudly, naming the deferral', () => {
    expect(() => native.RefreshButtonCompat(PROPS)).toThrow(/web-only/)
  })
})

describe('the subpath barrel resolves every symbol', () => {
  it('exports the component plus the shared contract', async () => {
    const barrel = await import('./index')
    // The barrel imports the base specifier; vitest resolves `.web` first.
    expect(barrel.RefreshButtonCompat).toBe(web.RefreshButtonCompat)
    expect(barrel.REFRESH_ICON_SIZE).toBe(16)
    expect(barrel.REFRESH_BUTTON_COMPAT_CLASS_UNIVERSE.length).toBeGreaterThan(0)
  })
})
