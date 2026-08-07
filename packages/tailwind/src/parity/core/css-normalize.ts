/**
 * Deterministic CSS normalization for the parity harness. Both sides of a
 * comparison are reduced to a canonical longhand `property → value` map:
 * resolve vars → expand shorthands → canonicalize values. Anything
 * unrecognized throws instead of being coerced.
 */
import { type Declarations, splitTopLevel } from './css-parse'

// ── Variable resolution ────────────────────────────────────────────────

export type VarTable = Map<string, string>

/**
 * Substitute `var(--x)` / `var(--x, fallback)` recursively.
 * Unknown variables throw unless a fallback exists — the comparison must
 * never run on unresolved var() references.
 */
export function resolveVars(value: string, table: VarTable): string {
  const resolve = (input: string, depth: number): string => {
    if (depth > 20) {
      throw new Error(`resolveVars: var() chain too deep for "${value}"`)
    }
    if (!input.includes('var(')) {
      return input
    }
    let result = ''
    let i = 0
    while (i < input.length) {
      const idx = input.indexOf('var(', i)
      if (idx === -1) {
        result += input.slice(i)
        break
      }
      result += input.slice(i, idx)
      // find matching ')'
      let depthParen = 1
      let j = idx + 4
      while (j < input.length && depthParen > 0) {
        if (input[j] === '(') {
          depthParen++
        } else if (input[j] === ')') {
          depthParen--
        }
        j++
      }
      const inner = input.slice(idx + 4, j - 1)
      const [name, ...fallbackParts] = splitTopLevel(inner, ',')
      const varName = name.trim()
      if (table.has(varName)) {
        result += resolve(table.get(varName) ?? '', depth + 1)
      } else if (fallbackParts.length > 0) {
        result += resolve(fallbackParts.join(',').trim(), depth + 1)
      } else {
        throw new Error(`resolveVars: unresolved variable ${varName}`)
      }
      i = j
    }
    return result
  }
  return resolve(value, 0)
}

// ── Color canonicalization ─────────────────────────────────────────────

const NAMED_COLORS: Record<string, string> = {
  transparent: 'rgba(0,0,0,0)',
  white: 'rgba(255,255,255,1)',
  black: 'rgba(0,0,0,1)',
}

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

function formatRgba({ r, g, b, a }: Rgba): string {
  const alpha = Math.round(a * 10000) / 10000
  return `rgba(${r},${g},${b},${alpha})`
}

function hexToRgba(hex: string): Rgba {
  const expand = (s: string): number => parseInt(s.length === 1 ? s + s : s, 16)
  if (hex.length === 3 || hex.length === 4) {
    return {
      r: expand(hex[0]),
      g: expand(hex[1]),
      b: expand(hex[2]),
      a: hex.length === 4 ? expand(hex[3]) / 255 : 1,
    }
  }
  if (hex.length === 6 || hex.length === 8) {
    return {
      r: expand(hex.slice(0, 2)),
      g: expand(hex.slice(2, 4)),
      b: expand(hex.slice(4, 6)),
      a: hex.length === 8 ? expand(hex.slice(6, 8)) / 255 : 1,
    }
  }
  throw new Error(`canonicalColor: bad hex "#${hex}"`)
}

function rgbFunctionToRgba(inner: string): Rgba {
  const normalized = inner.replace(/\s*\/\s*/, ',').replace(/\s+/g, ' ')
  const parts = (normalized.includes(',') ? normalized.split(',') : normalized.split(' '))
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length < 3 || parts.length > 4) {
    throw new Error(`canonicalColor: bad rgb() "rgb(${inner})"`)
  }
  const channel = (s: string): number => (s.endsWith('%') ? Math.round(parseFloat(s) * 2.55) : parseFloat(s))
  const alphaPart = parts.length === 4 ? parts[3] : undefined
  const a = alphaPart === undefined ? 1 : alphaPart.endsWith('%') ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart)
  return { r: channel(parts[0]), g: channel(parts[1]), b: channel(parts[2]), a }
}

/**
 * Canonicalize a CSS color to `rgba(r,g,b,a)` (alpha rounded to 4 decimals).
 * Supports #rgb/#rgba/#rrggbb/#rrggbbaa, rgb()/rgba() (comma or space syntax),
 * and the few keywords the design system uses. Throws on anything else —
 * an unexpected format must fail the comparison, not skew it.
 */
export function canonicalColor(raw: string): string {
  const value = raw.trim().toLowerCase()
  if (Object.hasOwn(NAMED_COLORS, value)) {
    return NAMED_COLORS[value]
  }
  if (value.startsWith('#')) {
    return formatRgba(hexToRgba(value.slice(1)))
  }
  const fn = value.match(/^rgba?\((.*)\)$/)
  if (fn !== null) {
    return formatRgba(rgbFunctionToRgba(fn[1]))
  }
  throw new Error(`canonicalColor: unsupported color format "${raw}"`)
}

// ── Longhand normalization ─────────────────────────────────────────────

const COLOR_PROPS = new Set([
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'caret-color',
])

/** Properties whose values can embed colors inside longer expressions. */
const COLOR_EMBEDDING_PROPS = new Set(['box-shadow'])

/** Canonicalize every hex/rgb(a) color occurring inside a composite value. */
function canonicalizeEmbeddedColors(value: string): string {
  return value
    .replace(/#[0-9a-fA-F]{3,8}\b/g, (match) => canonicalColor(match))
    .replace(/rgba?\((?:[^()]*)\)/g, (match) => canonicalColor(match))
}

const LENGTH_PROPS_ZERO_PX = new Set([
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'row-gap',
  'column-gap',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'flex-basis',
])

function splitParts(value: string): string[] {
  return splitTopLevel(value, ' ')
    .map((p) => p.trim())
    .filter(Boolean)
}

/** CSS box shorthand expansion: 1→4, 2→(v h), 3→(t h b), 4→(t r b l). */
function fourSides(value: string): [string, string, string, string] {
  const parts = splitParts(value)
  if (parts.length === 0 || parts.length > 4) {
    throw new Error(`fourSides: cannot expand "${value}"`)
  }
  const top = parts[0]
  const right = parts.length > 1 ? parts[1] : top
  const bottom = parts.length > 2 ? parts[2] : top
  const left = parts.length > 3 ? parts[3] : right
  return [top, right, bottom, left]
}

/** Two-value axis shorthand expansion (gap, margin-inline, …). */
function twoParts(value: string): [string, string] {
  const parts = splitParts(value)
  if (parts.length === 0 || parts.length > 2) {
    throw new Error(`twoParts: cannot expand "${value}"`)
  }
  const first = parts[0]
  return [first, parts.length > 1 ? parts[1] : first]
}

function boxExpansion(prefix: string, suffix: string): (value: string) => Declarations {
  const prop = (side: string): string => (suffix === '' ? `${prefix}-${side}` : `${prefix}-${side}-${suffix}`)
  return (value) => {
    const [t, r, b, l] = fourSides(value)
    return { [prop('top')]: t, [prop('right')]: r, [prop('bottom')]: b, [prop('left')]: l }
  }
}

function axisExpansion(propA: string, propB: string): (value: string) => Declarations {
  return (value) => {
    const [a, b] = twoParts(value)
    return { [propA]: a, [propB]: b }
  }
}

function expandFlex(value: string): Declarations {
  // canonical browser expansion: flex: <grow> [<shrink> [<basis>]]
  const parts = splitParts(value)
  if (parts.length === 0 || parts.length > 3) {
    throw new Error(`expandDeclaration: cannot expand "flex: ${value}"`)
  }
  return {
    'flex-grow': parts[0],
    'flex-shrink': parts.length > 1 ? parts[1] : '1',
    'flex-basis': parts.length > 2 ? parts[2] : '0%',
  }
}

function expandBorderRadius(value: string): Declarations {
  const [tl, tr, br, bl] = fourSides(value)
  return {
    'border-top-left-radius': tl,
    'border-top-right-radius': tr,
    'border-bottom-right-radius': br,
    'border-bottom-left-radius': bl,
  }
}

/**
 * Shorthand → longhand expansions. Only shorthands the two systems actually
 * emit are supported; anything else passes through property-as-written.
 *
 * Physical-axis note: `margin-inline`/`padding-inline` (Tailwind v4's mx/px
 * output) map to left/right longhands — the harness assumes LTR, which
 * matches what Tamagui emits for the same props in an LTR document.
 */
const SHORTHAND_EXPANSIONS: Record<string, (value: string) => Declarations> = {
  margin: boxExpansion('margin', ''),
  padding: boxExpansion('padding', ''),
  inset: (value) => {
    const [t, r, b, l] = fourSides(value)
    return { top: t, right: r, bottom: b, left: l }
  },
  'margin-inline': axisExpansion('margin-left', 'margin-right'),
  'margin-block': axisExpansion('margin-top', 'margin-bottom'),
  'padding-inline': axisExpansion('padding-left', 'padding-right'),
  'padding-block': axisExpansion('padding-top', 'padding-bottom'),
  gap: axisExpansion('row-gap', 'column-gap'),
  flex: expandFlex,
  'border-width': boxExpansion('border', 'width'),
  'border-color': boxExpansion('border', 'color'),
  'border-style': boxExpansion('border', 'style'),
  'border-radius': expandBorderRadius,
  overflow: axisExpansion('overflow-x', 'overflow-y'),
}

/** Expand a single (possibly shorthand) declaration to longhands. */
export function expandDeclaration(prop: string, value: string): Declarations {
  if (Object.hasOwn(SHORTHAND_EXPANSIONS, prop)) {
    return SHORTHAND_EXPANSIONS[prop](value)
  }
  return { [prop]: value }
}

/**
 * Canonicalize a longhand value:
 * - colors → rgba() canonical form
 * - unitless zero → `0px` on length properties (`0` and `0px` are the same declaration)
 * - numeric strings trimmed of trailing zeros (`1.50` → `1.5`)
 * - everything lowercased/whitespace-collapsed
 */
export function canonicalValue(prop: string, value: string): string {
  const v = value.trim()
  if (COLOR_PROPS.has(prop)) {
    return canonicalColor(v)
  }
  let collapsed = v.replace(/\s+/g, ' ').toLowerCase()
  if (COLOR_EMBEDDING_PROPS.has(prop)) {
    collapsed = canonicalizeEmbeddedColors(collapsed)
  }
  // `a, b` and `a,b` are the same declaration — compare without comma spacing.
  collapsed = collapsed.replace(/,\s+/g, ',')
  if (LENGTH_PROPS_ZERO_PX.has(prop) && collapsed === '0') {
    return '0px'
  }
  if (/^-?\d*\.?\d+$/.test(collapsed)) {
    return String(parseFloat(collapsed))
  }
  const px = collapsed.match(/^(-?\d*\.?\d+)px$/)
  if (px !== null) {
    return `${parseFloat(px[1])}px`
  }
  return collapsed
}

/**
 * Full normalization pipeline for one side of the comparison:
 * resolve vars → expand shorthands → canonicalize values.
 */
export function normalizeDeclarations(decls: Declarations, vars: VarTable): Declarations {
  const out: Declarations = {}
  for (const [prop, rawValue] of Object.entries(decls)) {
    if (prop.startsWith('--')) {
      continue // custom properties are inputs to resolution, not outputs
    }
    // Tamagui bumps pseudo-state rules with !important; priority is a cascade
    // concern, not a declaration-value difference — strip before comparing.
    const withoutPriority = rawValue.replace(/\s*!important\s*$/i, '')
    const resolved = resolveVars(withoutPriority, vars)
    for (const [longProp, longValue] of Object.entries(expandDeclaration(prop, resolved))) {
      out[longProp] = canonicalValue(longProp, longValue)
    }
  }
  // Vendor-prefix folding: react-native-web/Tamagui emit `-webkit-` twins for
  // some properties (user-select, backdrop-filter). A prefixed declaration
  // that duplicates its unprefixed twin adds no information — drop it so the
  // comparison is about the standard property.
  for (const prop of Object.keys(out)) {
    const unprefixed = prop.match(/^-(?:webkit|moz|ms|o)-(.+)$/)?.[1]
    if (unprefixed !== undefined && out[unprefixed] === out[prop]) {
      delete out[prop]
    }
  }
  return out
}
