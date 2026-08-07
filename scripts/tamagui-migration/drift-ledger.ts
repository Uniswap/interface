#!/usr/bin/env bun
/**
 * Drift ledger: independent verifier for the Tamagui -> Tailwind color token migration.
 *
 * Compares Tamagui's runtime color source (`packages/ui/src/theme/color/colors.ts`
 * `colorsLight`/`colorsDark`/`networkColors` — imported directly, not re-parsed) against
 * the Tailwind v4 shared palette (`packages/tailwind/css/theme.css`). PR #35388 refreshes
 * that palette to match the current Tamagui generation; this ledger is how we verify it
 * actually does, independent of that PR's own audit.
 *
 * Scope: the semantic Spore colors (neutral/surface/accent/status, plus their hovered and
 * secondary-overlay variants) and the per-chain network colors. Tamagui and Tailwind name
 * these differently (`statusSuccess` vs `success`, `chain_10` vs `network-optimism`), so a
 * blind name-union diff would drown in permanent, by-design mismatches (deprecated `DEP_*`
 * tokens, numbered accent ramps, shadcn compat colors, etc. have no counterpart on the other
 * side and aren't part of this migration). SEMANTIC_TOKEN_MAP below is the curated overlap;
 * anything outside it is out of scope for this ledger, not silently "passing".
 *
 * `css/variables.css` and `native.css` only alias `theme.css` values (already guarded by
 * `packages/tailwind/src/tokens.parity.test.ts`), so they aren't re-read here.
 *
 * Usage: bun scripts/tamagui-migration/drift-ledger.ts [--check]
 *   --check exits non-zero when the ledger contains any unpinned drift (entries in
 *   INTENTIONAL_DRIFT are recorded as `intentional` and don't fail the check).
 * Writes: scripts/tamagui-migration/drift-ledger.json (gitignored)
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { colorsDark, colorsLight, networkColors } from 'ui/src/theme/color/colors'

interface DriftEntry {
  token: string
  tamagui: string
  tailwind: string
  status: 'missing' | 'mismatch' | 'intentional'
  justification?: string
}

type Mode = 'light' | 'dark'

interface TokenSource {
  /** Tailwind base name, e.g. `success-secondary-hovered` (no `-light`/`-dark` suffix). */
  label: string
  light: string
  dark: string
}

// Tamagui key (packages/ui/src/theme/color/colors.ts) -> Tailwind base name (packages/tailwind/css/theme.css).
const SEMANTIC_TOKEN_MAP: ReadonlyArray<{ tamagui: keyof typeof colorsLight; tailwind: string }> = [
  { tamagui: 'white', tailwind: 'white' },
  { tamagui: 'black', tailwind: 'black' },
  { tamagui: 'scrim', tailwind: 'scrim' },
  { tamagui: 'neutral1', tailwind: 'neutral1' },
  { tamagui: 'neutral1Hovered', tailwind: 'neutral1-hovered' },
  { tamagui: 'neutral2', tailwind: 'neutral2' },
  { tamagui: 'neutral2Hovered', tailwind: 'neutral2-hovered' },
  { tamagui: 'neutral3', tailwind: 'neutral3' },
  { tamagui: 'neutral3Hovered', tailwind: 'neutral3-hovered' },
  { tamagui: 'surface1', tailwind: 'surface1' },
  { tamagui: 'surface1Hovered', tailwind: 'surface1-hovered' },
  { tamagui: 'surface2', tailwind: 'surface2' },
  { tamagui: 'surface2Hovered', tailwind: 'surface2-hovered' },
  { tamagui: 'surface3', tailwind: 'surface3' },
  { tamagui: 'surface3Solid', tailwind: 'surface3-solid' },
  { tamagui: 'surface3Hovered', tailwind: 'surface3-hovered' },
  { tamagui: 'surface4', tailwind: 'surface4' },
  { tamagui: 'surface5', tailwind: 'surface5' },
  { tamagui: 'surface5Hovered', tailwind: 'surface5-hovered' },
  { tamagui: 'accent1', tailwind: 'accent1' },
  { tamagui: 'accent1Hovered', tailwind: 'accent1-hovered' },
  { tamagui: 'accent2', tailwind: 'accent2' },
  { tamagui: 'accent2Solid', tailwind: 'accent2-solid' },
  { tamagui: 'accent2Hovered', tailwind: 'accent2-hovered' },
  // Legacy accent3 was the neutral-inverse fill (#222222 light / #000000 hovered). Per design
  // decision (see INTENTIONAL_DRIFT), neutral fills now use neutral1, and the deprecated
  // Tailwind accent3 alias points at neutral1 — so accent3 drifts from the legacy source on
  // purpose. Kept in the map so the drift stays visible in the ledger (pinned, not hidden).
  { tamagui: 'accent3', tailwind: 'accent3' },
  { tamagui: 'accent3Hovered', tailwind: 'accent3-hovered' },
  { tamagui: 'statusSuccess', tailwind: 'success' },
  { tamagui: 'statusSuccessHovered', tailwind: 'success-hovered' },
  { tamagui: 'statusSuccess2', tailwind: 'success-secondary' },
  { tamagui: 'statusSuccess2Hovered', tailwind: 'success-secondary-hovered' },
  { tamagui: 'statusWarning', tailwind: 'warning' },
  { tamagui: 'statusWarningHovered', tailwind: 'warning-hovered' },
  { tamagui: 'statusWarning2', tailwind: 'warning-secondary' },
  { tamagui: 'statusWarning2Hovered', tailwind: 'warning-secondary-hovered' },
  { tamagui: 'statusCritical', tailwind: 'critical' },
  { tamagui: 'statusCriticalHovered', tailwind: 'critical-hovered' },
  { tamagui: 'statusCritical2', tailwind: 'critical-secondary' },
  { tamagui: 'statusCritical2Hovered', tailwind: 'critical-secondary-hovered' },
]

interface DriftPin {
  /** `<tailwind-name>.<mode>`, matching DriftEntry.token. */
  token: string
  tamagui: string
  tailwind: string
  justification: string
}

const ACCENT3_JUSTIFICATION =
  'Neutral-themed fills use neutral1 (with surface1 labels), no separate inverse value; the deprecated ' +
  'Tailwind accent3 alias points at neutral1 — design decision, Zack Labadie + Philippe Cao, 2026-07-29, ' +
  'Slack thread p1785279539918389'

/**
 * Drift that is a deliberate design decision, not migration slippage. An entry is pinned only
 * while BOTH sides still equal the recorded values — if either side moves again, the entry
 * resurfaces as a hard mismatch and `--check` fails. (accent3.dark is #ffffff on both sides,
 * so it needs no pin.)
 */
const INTENTIONAL_DRIFT: ReadonlyArray<DriftPin> = [
  { token: 'accent3.light', tamagui: '#222222', tailwind: '#131313', justification: ACCENT3_JUSTIFICATION },
  {
    token: 'accent3-hovered.light',
    tamagui: '#000000',
    tailwind: 'rgba(19, 19, 19, 0.83)',
    justification: ACCENT3_JUSTIFICATION,
  },
  {
    token: 'accent3-hovered.dark',
    tamagui: '#f5f5f5',
    tailwind: 'rgba(255, 255, 255, 0.85)',
    justification: ACCENT3_JUSTIFICATION,
  },
]

/** Grab the body of a single-brace-depth block (no nested braces inside). Borrowed approach from tokens.parity.test.ts. */
function extractBlockBody(css: string, opener: RegExp): string {
  const match = css.match(opener)
  if (!match || match.index === undefined) {
    throw new Error(`drift-ledger: block not found for ${opener}`)
  }
  const start = match.index + match[0].length
  const end = css.indexOf('}', start)
  if (end === -1) {
    throw new Error(`drift-ledger: unterminated block for ${opener}`)
  }
  const body = css.slice(start, end)
  if (body.includes('{')) {
    throw new Error(`drift-ledger: nested braces under ${opener} — extend the parser to handle nested rules`)
  }
  return body
}

/** `--color-*` declarations in the `@theme { ... }` block, keyed by name without the leading `--`. */
function parseThemeCssColorVars(css: string): Map<string, string> {
  const body = extractBlockBody(css, /@theme\s*{/)
  const vars = new Map<string, string>()
  for (const match of body.matchAll(/--(color-[\w-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1]
    const value = match[2]
    if (name !== undefined && value !== undefined) {
      vars.set(name, value.trim())
    }
  }
  return vars
}

/** Light/dark-suffixed value if present, else the mode-independent bare value, else empty (missing). */
function resolveTailwindValue(vars: Map<string, string>, label: string, mode: Mode): string {
  return vars.get(`color-${label}-${mode}`) ?? vars.get(`color-${label}`) ?? ''
}

const HEX_COLOR = /^#[0-9a-f]{3,8}$/
const RGBA_COLOR = /^(rgba?)\(([^)]+)\)$/

/**
 * Lowercase + collapse whitespace/precision so equivalent hex/rgba spellings compare equal.
 * Does NOT convert between hex-alpha and rgba() — a hex8 vs rgba() pair with the same visual
 * color will still show as drift. That conversion is out of scope here (see README).
 */
function normalizeColor(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') {
    return ''
  }
  const lower = trimmed.toLowerCase()
  if (HEX_COLOR.test(lower)) {
    return lower
  }
  const rgbaMatch = lower.match(RGBA_COLOR)
  if (rgbaMatch) {
    const fn = rgbaMatch[1] ?? 'rgba'
    const args = (rgbaMatch[2] ?? '').split(',').map((part) => String(Number.parseFloat(part.trim())))
    return `${fn}(${args.join(', ')})`
  }
  return lower
}

function buildTokenSources(): TokenSource[] {
  const semantic = SEMANTIC_TOKEN_MAP.map(
    ({ tamagui, tailwind }): TokenSource => ({
      label: tailwind,
      light: colorsLight[tamagui],
      dark: colorsDark[tamagui],
    }),
  )
  // Network tokens follow the `network-<key>` pattern. `network-bnb` is missing on main pre-#35388
  // (only the legacy `network-bsc` alias ships), so it shows as drift until that PR lands.
  const network = (Object.keys(networkColors) as Array<keyof typeof networkColors>).map(
    (key): TokenSource => ({
      label: `network-${key}`,
      light: networkColors[key].light,
      dark: networkColors[key].dark,
    }),
  )
  return [...semantic, ...network]
}

function buildDriftLedger(sources: TokenSource[], tailwindVars: Map<string, string>): DriftEntry[] {
  const entries: DriftEntry[] = []
  for (const source of sources) {
    for (const mode of ['light', 'dark'] as const) {
      const tamaguiRaw = mode === 'light' ? source.light : source.dark
      const tailwindRaw = resolveTailwindValue(tailwindVars, source.label, mode)
      if (normalizeColor(tamaguiRaw) !== normalizeColor(tailwindRaw)) {
        const token = `${source.label}.${mode}`
        const pin = INTENTIONAL_DRIFT.find(
          (candidate) =>
            candidate.token === token &&
            normalizeColor(candidate.tamagui) === normalizeColor(tamaguiRaw) &&
            normalizeColor(candidate.tailwind) === normalizeColor(tailwindRaw),
        )
        entries.push({
          token,
          tamagui: tamaguiRaw,
          tailwind: tailwindRaw,
          status: pin ? 'intentional' : tailwindRaw === '' ? 'missing' : 'mismatch',
          ...(pin ? { justification: pin.justification } : {}),
        })
      }
    }
  }
  return entries.sort((a, b) => a.token.localeCompare(b.token))
}

function main(): void {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
  const themeCssPath = join(repoRoot, 'packages', 'tailwind', 'css', 'theme.css')
  const themeCss = readFileSync(themeCssPath, 'utf8')

  const tailwindVars = parseThemeCssColorVars(themeCss)
  const sources = buildTokenSources()
  const ledger = buildDriftLedger(sources, tailwindVars)

  const outPath = join(dirname(fileURLToPath(import.meta.url)), 'drift-ledger.json')
  writeFileSync(outPath, JSON.stringify(ledger, null, 2) + '\n')

  if (ledger.length > 0) {
    console.table(ledger.map(({ justification: _justification, ...entry }) => entry))
  }
  const missing = ledger.filter((entry) => entry.status === 'missing').length
  const intentional = ledger.filter((entry) => entry.status === 'intentional').length
  const mismatched = ledger.length - missing - intentional
  console.log(
    `${ledger.length} drifted tokens (${missing} missing, ${mismatched} mismatched, ${intentional} intentional/pinned)`,
  )

  if (process.argv.includes('--check')) {
    process.exitCode = ledger.length - intentional > 0 ? 1 : 0
  }
}

main()
