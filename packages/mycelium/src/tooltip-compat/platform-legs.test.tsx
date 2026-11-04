/**
 * Pins the platform-leg contract of the tooltip compat (INFRA-3514,
 * `web-bottom-sheet-compat/platform-legs.test.tsx` precedent): the
 * platformless BASE stub fails loudly for every compound part, and the three
 * legs (and their entry barrels) export the same symbol set — exactly the
 * drift the base leg's hand-restated types cannot surface through tsc alone.
 * Web behavior is pinned by `TooltipCompat.web.test.tsx`.
 */
import { PlatformSplitStubError } from '@universe/environment'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as nativeBarrel from './index.native'
import * as baseBarrel from './index.ts'
import * as webBarrel from './index.web'
import * as native from './TooltipCompat.native'
// Explicit extensions: the mycelium vitest config resolves `.web.*` first,
// which would silently swap the platformless base leg for the web leg.
import * as base from './TooltipCompat.tsx'
import * as web from './TooltipCompat.web'

describe('the platformless base stub throws the platform-override contract', () => {
  it.each([
    ['TooltipCompat', (): string => renderToStaticMarkup(<base.TooltipCompat />)],
    ['TooltipCompat.Trigger', (): string => renderToStaticMarkup(<base.TooltipCompat.Trigger />)],
    ['TooltipCompat.Content', (): string => renderToStaticMarkup(<base.TooltipCompat.Content />)],
    ['TooltipCompat.Arrow', (): string => renderToStaticMarkup(<base.TooltipCompat.Arrow />)],
  ])('%s', (_name, render) => {
    // Reaching the base leg means the bundler's platform extension order did
    // not resolve — every part must fail loudly, not render the wrong leg.
    expect(render).toThrowError(PlatformSplitStubError)
    expect(render).toThrowError(/Did you forget a platform override\?/)
  })
})

describe('export parity across the legs', () => {
  it('the web and native legs export exactly the base leg symbol set', () => {
    expect(Object.keys(web).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(base).sort()).toEqual(['TooltipCompat', 'TooltipCompatConfigContext'])
  })

  it('the compound parts exist on every leg', () => {
    for (const leg of [base.TooltipCompat, web.TooltipCompat, native.TooltipCompat]) {
      expect(Object.keys(leg).sort()).toEqual(['Arrow', 'Content', 'Trigger'])
    }
  })

  it('the entry barrels export exactly the base barrel symbol set', () => {
    expect(Object.keys(webBarrel).sort()).toEqual(Object.keys(baseBarrel).sort())
    expect(Object.keys(nativeBarrel).sort()).toEqual(Object.keys(baseBarrel).sort())
    // The base barrel's self-import must stay extensionless so `.web`-priority
    // bundlers swap it; pinning it to the throwing base broke apps/web + extension.
    expect(() => renderToStaticMarkup(<baseBarrel.TooltipCompat />)).not.toThrow()
  })

  it('the legs are a real split, not accidental aliases', () => {
    expect(web.TooltipCompat as unknown).not.toBe(base.TooltipCompat)
    expect(native.TooltipCompat as unknown).not.toBe(web.TooltipCompat)
    expect(native.TooltipCompat as unknown).not.toBe(base.TooltipCompat)
  })
})
