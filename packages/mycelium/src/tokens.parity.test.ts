import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { radii, typography } from '@universe/tailwind'
import {
  borderRadii as uiBorderRadii,
  fonts as uiFonts,
  iconSizes as uiIconSizes,
  spacing as uiSpacing,
  zIndexes as uiZIndexes,
} from 'ui/src/theme'
import { describe, expect, it } from 'vitest'
import { borderRadii, fonts, iconSizes, spacing, zIndexes } from './tokens'

/**
 * INFRA-2951 exit test — token-constants compat.
 *
 * Layer 1: each Mycelium constant family must be member-for-member equal to
 * its ui/src/theme equivalent, resolved exactly as the web app resolves it
 * (web platform splits + APP_ID=web, see vitest.config.ts).
 *
 * Layer 2 (derivation honesty guard): the `@universe/tailwind` TS token
 * values Mycelium derives from must equal the values parsed out of that
 * package's own css/theme.css. This pins the TS mirror to the CSS source of
 * truth, so a Layer 1 pass can never come from ui literals smuggled into the
 * derivation chain.
 *
 * A Layer 1 failure is token drift (or a token missing from
 * `@universe/tailwind` entirely) — never "fix" it by hardcoding the ui value.
 * Drift ledger: INFRA-2951.
 */

describe('mycelium tokens ↔ ui/src/theme parity (INFRA-2951 exit test)', () => {
  it('iconSizes', () => {
    expect(iconSizes).toEqual(uiIconSizes)
  })

  it('spacing', () => {
    expect(spacing).toEqual(uiSpacing)
  })

  it('zIndexes', () => {
    expect(zIndexes).toEqual(uiZIndexes)
  })

  it('fonts', () => {
    expect(fonts).toEqual(uiFonts)
  })

  it('borderRadii', () => {
    expect(borderRadii).toEqual(uiBorderRadii)
  })
})

// ── Layer 2: @universe/tailwind TS tokens ↔ css/theme.css ─────────────────

const themeCss = readFileSync(createRequire(import.meta.url).resolve('@universe/tailwind/theme'), 'utf8')

/**
 * `--radius-<name>: <n>px` declarations → { name: n }. Throws on any other
 * `--radius-*` value shape, so a member can never silently skip the guard.
 */
function parseCssRadii(css: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const match of css.matchAll(/--radius-(?<name>[a-z0-9-]+):\s*(?<value>[^;]+);/g)) {
    const name = match.groups?.name
    const rawValue = match.groups?.value
    if (name === undefined || rawValue === undefined) {
      continue
    }
    const value = rawValue.trim()
    if (!/^[\d.]+px$/.test(value)) {
      throw new Error(`parseCssRadii: unparseable --radius-${name} value "${value}" (expected "<n>px")`)
    }
    out[name] = Number(value.replace(/px$/, ''))
  }
  return out
}

interface CssTypographyToken {
  fontSize?: number
  lineHeight?: number
  fontWeight?: number
  letterSpacing?: string
}

/** `<n>px` or `<n>rem` (16px base) → px number. Throws on any other shape. */
function parseCssLengthPx(value: string, context: string): number {
  if (/^-?[\d.]+px$/.test(value)) {
    return Number(value.slice(0, -'px'.length))
  }
  if (/^-?[\d.]+rem$/.test(value)) {
    return Number(value.slice(0, -'rem'.length)) * 16
  }
  throw new Error(`parseCssLengthPx: unparseable ${context} value "${value}" (expected "<n>px" or "<n>rem")`)
}

/** `--text-<variant>[--<modifier>]: <value>` declarations → per-variant tokens. */
function parseCssTypography(css: string): Record<string, CssTypographyToken> {
  const out: Record<string, CssTypographyToken> = {}
  for (const match of css.matchAll(/--text-(?<key>[a-z0-9-]+):\s*(?<value>[^;]+);/g)) {
    const key = match.groups?.key
    const rawValue = match.groups?.value
    if (key === undefined || key === '' || rawValue === undefined) {
      continue
    }
    const sepIndex = key.indexOf('--')
    const variant = sepIndex === -1 ? key : key.slice(0, sepIndex)
    const modifier = sepIndex === -1 ? undefined : key.slice(sepIndex + 2)
    const value = rawValue.trim()
    const token = (out[variant] ??= {})
    if (modifier === undefined) {
      token.fontSize = parseCssLengthPx(value, `--text-${key}`)
    } else if (modifier === 'line-height') {
      token.lineHeight = parseCssLengthPx(value, `--text-${key}`)
    } else if (modifier === 'font-weight') {
      token.fontWeight = Number(value)
    } else if (modifier === 'letter-spacing') {
      token.letterSpacing = value
    } else {
      throw new Error(`parseCssTypography: unknown --text modifier "${modifier}"`)
    }
  }
  return out
}

describe('@universe/tailwind TS tokens ↔ css/theme.css (derivation honesty guard)', () => {
  it('radii match the --radius-* custom properties', () => {
    expect({ ...radii }).toEqual(parseCssRadii(themeCss))
  })

  it('typography matches the --text-* custom properties', () => {
    const plainTypography = Object.fromEntries(
      Object.entries(typography).map(([variant, token]) => [variant, { ...token }]),
    )
    expect(plainTypography).toEqual(parseCssTypography(themeCss))
  })
})
