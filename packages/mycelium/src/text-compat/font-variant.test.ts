/**
 * The font-variant helpers (`getTextVariantKey` / `getFontStylesForVariant` /
 * `ALL_FONT_VARIANT_TOKENS`): the generated `VARIANT_METRICS` mirror must
 * resolve to the web `fonts` table, plus the legacy fallback and ordering.
 *
 * SCOPE: this file runs under `packages/mycelium/vitest.config.ts` (jsdom,
 * `.web.*` resolved first), so the native leg resolves the deterministic
 * web-equivalent environment column (iOS naming, CJK-equal sizes — see
 * `native-font-environment.ts`). The adjusted on-device ramp the native leg
 * composes is pinned per platform in `native-font.test.ts`.
 */
import type { FontVariantToken } from '@universe/tailwind/types'
import { describe, expect, it } from 'vitest'
import { fonts, type FontVariantName } from '../font-tokens.web'
import { WEB_BASEL_FONT_STACK } from '../token-constants'
import type { ResolvedFontStyle } from './font-variant-shared'
import * as nativeLeg from './font-variant.native'
// Explicit .ts extension: the mycelium vitest config resolves `.web.*` first,
// which would silently swap the platformless base leg for the web leg here.
import * as base from './font-variant.ts'
import * as web from './font-variant.web'

const WEB_MONO = 'InputMono-Regular'

/**
 * The web resolution per variant, built from the web `fonts` table: nominal
 * weights ('400'/'500' — the 485/535 web-app weights belong to the className
 * lane, never to `ResolvedFontStyle`), the Basel stack, and the raw mono file
 * name (the documented legacy fall-through for the mono family). The values
 * themselves are pinned to css/theme.css by @universe/tailwind's tokens guard.
 */
function expectedWebStyle(variant: FontVariantName): ResolvedFontStyle {
  const token = fonts[variant]
  return {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    family: variant === 'monospace' ? WEB_MONO : WEB_BASEL_FONT_STACK,
    fontWeight: token.fontWeight ?? '400',
    letterSpacing: token.letterSpacing,
  }
}

/** Equal up to float noise in the scaled line-heights (the generated mirror carries rendered literals). */
function expectStyle(actual: ResolvedFontStyle, expected: ResolvedFontStyle): void {
  expect({ ...actual, lineHeight: undefined }).toEqual({ ...expected, lineHeight: undefined })
  expect(actual.lineHeight).toBeCloseTo(expected.lineHeight, 10)
}

/** The legacy token list, in the legacy fonts-table insertion order. */
const LEGACY_TOKENS = [
  '$heading1',
  '$heading2',
  '$heading3',
  '$subheading1',
  '$subheading2',
  '$body1',
  '$body2',
  '$body3',
  '$body4',
  '$body5',
  '$buttonLabel1',
  '$buttonLabel2',
  '$buttonLabel3',
  '$buttonLabel4',
  '$monospace',
] as const

describe('getFontStylesForVariant (web legs)', () => {
  it.each(LEGACY_TOKENS)('%s resolves the legacy web font style', (token) => {
    const expected = expectedWebStyle(token.slice(1) as FontVariantName)
    expectStyle(web.getFontStylesForVariant(token), expected)
    expectStyle(base.getFontStylesForVariant(token), expected)
  })

  it('resolves out-of-set tokens through the legacy fallback variant', () => {
    expectStyle(web.getFontStylesForVariant('$notAVariant' as FontVariantToken), expectedWebStyle('heading2'))
  })
})

describe('getFontStylesForVariant (native leg under the deterministic web-equivalent environment)', () => {
  it.each(LEGACY_TOKENS)('%s resolves web-equal metrics with the iOS font naming', (token) => {
    const resolved = nativeLeg.getFontStylesForVariant(token)
    const webResolved = expectedWebStyle(token.slice(1) as FontVariantName)
    expect(resolved.fontSize).toBe(webResolved.fontSize)
    // The native leg computes scaled line-heights as raw JS floats (as native
    // Tamagui does), while the web mirror carries the rendered literals — the
    // same value up to float noise.
    expect(resolved.lineHeight).toBeCloseTo(webResolved.lineHeight, 10)
    expect(resolved.fontWeight).toBe(webResolved.fontWeight)
    expect(resolved.letterSpacing).toBe(webResolved.letterSpacing)
    expect(resolved.family).toBe(token === '$monospace' ? 'InputMono-Regular' : 'Basel Grotesk')
  })
})

describe('getTextVariantKey', () => {
  it.each(LEGACY_TOKENS)('%s strips the prefix', (token) => {
    expect(base.getTextVariantKey(token)).toBe(token.slice(1))
  })

  it('falls back to the legacy default for out-of-set tokens', () => {
    expect(base.getTextVariantKey('$notAVariant' as FontVariantToken)).toBe('heading2')
  })
})

describe('ALL_FONT_VARIANT_TOKENS', () => {
  it('lists every legacy token in the legacy order', () => {
    expect(base.ALL_FONT_VARIANT_TOKENS).toEqual([...LEGACY_TOKENS])
  })
})

describe('platform legs', () => {
  it('export the same runtime surface', () => {
    const names = (mod: object): string[] => Object.keys(mod).sort()
    expect(names(web)).toEqual(names(base))
    expect(names(nativeLeg)).toEqual(names(base))
  })

  it('web leg and base leg resolve identically (shared implementation)', () => {
    expect(web.getFontStylesForVariant).toBe(base.getFontStylesForVariant)
    expect(web.getTextVariantKey).toBe(base.getTextVariantKey)
  })
})
