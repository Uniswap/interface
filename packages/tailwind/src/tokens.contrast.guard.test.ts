import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it, onTestFailed } from 'vitest'

/**
 * WCAG 2.x contrast guard for the colour tokens in css/theme.css. Translucent
 * foregrounds are composited over the surface they sit on before the
 * relative-luminance ratio is taken, which is how the browser paints them.
 */

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const themeCss = readFileSync(join(pkgRoot, 'css', 'theme.css'), 'utf8')

const THEMES = ['light', 'dark'] as const
type Theme = (typeof THEMES)[number]

const SURFACES = ['surface1', 'surface2', 'surface3'] as const

/** Token name in the TS/semantic API → CSS custom property stem. */
const TEXT_TOKENS = {
  neutral1: 'neutral1',
  neutral2: 'neutral2',
  neutral3: 'neutral3',
  accent1: 'accent1',
  statusSuccess: 'success',
  statusCritical: 'critical',
  statusWarning: 'warning',
} as const

const TEXT_RATIO = 4.5
const UI_COMPONENT_RATIO = 3

// TODO: delete this allowlist once design decides new values for these tokens.
// A listed pair that starts passing fails the guard, so entries can't go stale.
const KNOWN_FAILURES: ReadonlySet<string> = new Set([
  'light neutral3 on surface1',
  'light neutral3 on surface2',
  'light neutral3 on surface3',
  'light accent1 on surface1',
  'light accent1 on surface2',
  'light accent1 on surface3',
  'light statusSuccess on surface2',
  'light statusSuccess on surface3',
  'light statusCritical on surface3',
  'light statusWarning on surface2',
  'light statusWarning on surface3',
  'light white on accent1',
  'dark neutral3 on surface1',
  'dark neutral3 on surface2',
  'dark neutral3 on surface3',
  'dark accent1 on surface3',
  'dark statusCritical on surface3',
  'dark white on accent1',
])

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

interface ContrastPair {
  id: string
  ratio: number
  required: number
  allowlisted: boolean
  label: string
}

const pairs = buildPairs()
let anyFailed = false

describe('colour token contrast (WCAG 2.x, css/theme.css)', () => {
  afterAll(() => {
    if (anyFailed) {
      console.log(formatReport(pairs))
    }
  })

  // `%s` over `$label`: vitest truncates object-property interpolation at 40 chars.
  it.each(pairs.map((pair) => [pair.label, pair] as const))('%s', (_label, { id, ratio, required, allowlisted }) => {
    onTestFailed(() => {
      anyFailed = true
    })
    if (allowlisted) {
      expect(ratio, `${id} now passes; remove it from KNOWN_FAILURES`).toBeLessThan(required)
    } else {
      expect(ratio, `${id} is below ${required}:1`).toBeGreaterThanOrEqual(required)
    }
  })

  it('KNOWN_FAILURES only lists pairs the guard checks', () => {
    const ids = new Set(pairs.map((pair) => pair.id))
    expect([...KNOWN_FAILURES].filter((id) => !ids.has(id))).toEqual([])
  })
})

function buildPairs(): ContrastPair[] {
  const out: ContrastPair[] = []
  const white = readColor('white')
  for (const theme of THEMES) {
    const surface1 = readColor(`surface1-${theme}`)
    for (const surfaceName of SURFACES) {
      // surface3 is translucent; it is always layered on surface1 of the same theme.
      const surface = composite(readColor(`${surfaceName}-${theme}`), surface1)
      for (const [token, stem] of Object.entries(TEXT_TOKENS)) {
        const fg = composite(readColor(`${stem}-${theme}`), surface)
        out.push(
          createPair({ theme, fg: token, bg: surfaceName, ratio: contrastRatio(fg, surface), required: TEXT_RATIO }),
        )
      }
    }
    const accent1 = composite(readColor(`accent1-${theme}`), surface1)
    out.push(
      createPair({ theme, fg: 'white', bg: 'accent1', ratio: contrastRatio(white, accent1), required: TEXT_RATIO }),
      createPair({
        theme,
        fg: 'accent1 (UI component)',
        bg: 'surface1',
        ratio: contrastRatio(accent1, surface1),
        required: UI_COMPONENT_RATIO,
      }),
    )
  }
  return out
}

function createPair(input: { theme: Theme; fg: string; bg: string; ratio: number; required: number }): ContrastPair {
  const id = `${input.theme} ${input.fg} on ${input.bg}`
  const allowlisted = KNOWN_FAILURES.has(id)
  const status = allowlisted ? 'known failure' : 'pass'
  return {
    id,
    ratio: input.ratio,
    required: input.required,
    allowlisted,
    label: `${id}: ${input.ratio.toFixed(2)}:1 (needs ${input.required}:1, ${status})`,
  }
}

/** Reads `--color-<name>` from theme.css. Throws when it is missing or not `#rrggbb` / `rgba(r, g, b, a)`. */
function readColor(name: string): Rgba {
  const match = themeCss.match(new RegExp(`--color-${name}:\\s*(?<value>[^;]+);`))
  const value = match?.groups?.['value']?.trim()
  if (value === undefined) {
    throw new Error(`readColor: --color-${name} not found in css/theme.css`)
  }
  const hex = /^#(?<hex>[0-9a-f]{6})$/i.exec(value)?.groups?.['hex']
  if (hex !== undefined) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    }
  }
  const rgba = /^rgba\(\s*(?<r>\d+),\s*(?<g>\d+),\s*(?<b>\d+),\s*(?<a>[\d.]+)\s*\)$/.exec(value)?.groups
  if (rgba?.['r'] !== undefined && rgba['g'] !== undefined && rgba['b'] !== undefined && rgba['a'] !== undefined) {
    return { r: Number(rgba['r']), g: Number(rgba['g']), b: Number(rgba['b']), a: Number(rgba['a']) }
  }
  throw new Error(`readColor: unparseable --color-${name} value "${value}" (expected "#rrggbb" or "rgba(r, g, b, a)")`)
}

/** Source-over alpha compositing of `fg` onto an opaque `bg`. */
function composite(fg: Rgba, bg: Rgba): Rgba {
  if (bg.a !== 1) {
    throw new Error('composite: background must be opaque')
  }
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  }
}

function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function relativeLuminance({ r, g, b }: Rgba): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

function linearize(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function formatReport(rows: ContrastPair[]): string {
  const width = Math.max(...rows.map((row) => row.id.length))
  const lines = rows.map((row) => {
    const passes = row.ratio >= row.required
    const verdict = passes ? 'pass' : row.allowlisted ? 'FAIL (allowlisted)' : 'FAIL'
    return `${row.id.padEnd(width)}  ${row.ratio.toFixed(2).padStart(5)}:1  needs ${row.required}:1  ${verdict}`
  })
  return ['Token contrast report', ...lines].join('\n')
}
