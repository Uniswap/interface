import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { fonts, iconSizes, radii, spacing, typography, zIndexes } from './tokens'

/**
 * Derivation honesty guard (INFRA-2951): the TS value mirror in ./tokens.ts
 * must equal the values parsed out of this package's own css/theme.css. This
 * pins the mirror to the CSS source of truth, so downstream derivations (e.g.
 * `@universe/mycelium` token constants) can never drift from the custom
 * properties — and ui literals can never be smuggled in as "tokens" without
 * a matching CSS declaration.
 *
 * Documented exceptions: `fonts[*].family` and `fonts[*].maxFontSizeMultiplier`
 * have no sensible CSS representation (Tamagui font token / React Native
 * text-scaling cap) and live only in the TS mirror; they are stripped before
 * the comparison.
 */

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const themeCss = readFileSync(join(pkgRoot, 'css', 'theme.css'), 'utf8')

/**
 * `--<prefix>-<name>: <n>px` declarations → { name: n }. Throws on any other
 * value shape under the prefix, so a member can never silently skip the guard.
 */
function parsePxFamily(css: string, prefix: string): Record<string, number> {
  const out: Record<string, number> = {}
  const pattern = new RegExp(`--${prefix}-(?<name>[a-z0-9-]+):\\s*(?<value>[^;]+);`, 'g')
  for (const match of css.matchAll(pattern)) {
    const name = match.groups?.name
    const rawValue = match.groups?.value
    if (name === undefined || rawValue === undefined) {
      continue
    }
    const value = rawValue.trim()
    if (!/^-?[\d.]+px$/.test(value)) {
      throw new Error(`parsePxFamily: unparseable --${prefix}-${name} value "${value}" (expected "<n>px")`)
    }
    out[name] = Number(value.replace(/px$/, ''))
  }
  return out
}

/** `--z-index-<name>: <n>` declarations (unitless) → { name: n }. */
function parseCssZIndexes(css: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const match of css.matchAll(/--z-index-(?<name>[a-z0-9-]+):\s*(?<value>-?\d+)\s*;/g)) {
    const name = match.groups?.name
    const value = match.groups?.value
    if (name !== undefined && value !== undefined) {
      out[name] = Number(value)
    }
  }
  return out
}

interface CssFontToken {
  fontSize?: number
  lineHeight?: number
  fontWeight?: string
  letterSpacing?: string
}

/** `--typography-<variant>[--<modifier>]: <value>` declarations → per-variant tokens. */
function parseCssFonts(css: string): Record<string, CssFontToken> {
  const out: Record<string, CssFontToken> = {}
  for (const match of css.matchAll(/--typography-(?<key>[a-z0-9-]+):\s*(?<value>[^;]+);/g)) {
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
      token.fontSize = Number(value.replace(/px$/, ''))
    } else if (modifier === 'line-height') {
      token.lineHeight = Number(value.replace(/px$/, ''))
    } else if (modifier === 'font-weight') {
      // ui fonts carry CSS-string weights ('400'/'500'), so keep the raw string.
      token.fontWeight = value
    } else if (modifier === 'letter-spacing') {
      token.letterSpacing = value
    } else {
      throw new Error(`parseCssFonts: unknown --typography modifier "${modifier}"`)
    }
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

describe('TS token mirror ↔ css/theme.css (derivation honesty guard)', () => {
  it('radii match the --radius-* custom properties', () => {
    expect({ ...radii }).toEqual(parsePxFamily(themeCss, 'radius'))
  })

  it('typography matches the --text-* custom properties', () => {
    const plainTypography = Object.fromEntries(
      Object.entries(typography).map(([variant, token]) => [variant, { ...token }]),
    )
    expect(plainTypography).toEqual(parseCssTypography(themeCss))
  })

  it('iconSizes match the --icon-size-* custom properties', () => {
    expect({ ...iconSizes }).toEqual(parsePxFamily(themeCss, 'icon-size'))
  })

  it('spacing matches the --ui-spacing-* custom properties', () => {
    expect({ ...spacing }).toEqual(parsePxFamily(themeCss, 'ui-spacing'))
  })

  it('zIndexes match the --z-index-* custom properties', () => {
    expect({ ...zIndexes }).toEqual(parseCssZIndexes(themeCss))
  })

  it('fonts match the --typography-* custom properties (family/maxFontSizeMultiplier are TS-only)', () => {
    const cssBackedFonts = Object.fromEntries(
      Object.entries(fonts).map(([variant, { family: _family, maxFontSizeMultiplier: _max, ...cssMembers }]) => [
        variant,
        cssMembers,
      ]),
    )
    expect(cssBackedFonts).toEqual(parseCssFonts(themeCss))
  })
})
