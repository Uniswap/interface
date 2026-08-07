import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Cross-platform token contract.
 *
 * The web bundle (css/variables.css) and the React Native entry (native.css)
 * express dark mode with two different, non-unifiable mechanisms:
 *   - web   → `.dark` ancestor class flips :root/.dark CSS vars
 *   - native→ uniwind `@layer theme { :root { @variant light|dark {…} } }`
 *
 * The *values* come from one shared palette (css/theme.css), but the semantic
 * alias layer is hand-authored in both dialects. These tests make the two
 * dialects impossible to drift silently: the set of Mycelium semantic color
 * utilities (bg-surface1, text-neutral1, …) must be identical across platforms,
 * and uniwind's "every theme defines the same variables" rule must hold.
 */

// The Mycelium semantic color utilities that components rely on cross-platform.
// (shadcn compat tokens and the deprecated accent3 neutral1-aliases are web-only and intentionally excluded.)
const MYCELIUM_SEMANTIC_COLORS = [
  'surface1',
  'surface1-hovered',
  'surface2',
  'surface2-hovered',
  'surface3',
  'surface3-hovered',
  'surface3-solid',
  'surface4',
  'surface5',
  'surface5-hovered',
  'neutral1',
  'neutral1-hovered',
  'neutral2',
  'neutral2-hovered',
  'neutral3',
  'neutral3-hovered',
  'accent1',
  'accent1-hovered',
  'accent2',
  'accent2-hovered',
  'accent2-solid',
  'success',
  'success-hovered',
  'success-secondary',
  'success-secondary-hovered',
  'warning',
  'warning-hovered',
  'warning-secondary',
  'warning-secondary-hovered',
  'critical',
  'critical-hovered',
  'critical-secondary',
  'critical-secondary-hovered',
  'network-arc',
  'network-blast',
  'network-bnb',
  'network-celo',
  'network-linea',
  'network-megaeth',
  'network-monad',
  'network-soneium',
  'network-tempo',
  'network-worldchain',
  'network-xlayer',
  'network-zora',
].sort()

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const variablesCss = readFileSync(join(pkgRoot, 'css', 'variables.css'), 'utf8')
const nativeCss = readFileSync(join(pkgRoot, 'native.css'), 'utf8')
const themeCss = readFileSync(join(pkgRoot, 'css', 'theme.css'), 'utf8')

/** Grab the body of a single-brace-depth block (no nested braces inside). */
function blockBody(css: string, opener: RegExp): string {
  const match = css.match(opener)
  if (!match) {
    throw new Error(`Block not found for ${opener}`)
  }
  const start = match.index! + match[0].length
  const end = css.indexOf('}', start)
  const body = css.slice(start, end)
  // This only handles flat `--var: value` blocks. A nested rule (e.g. an `@media`
  // guard) would make indexOf('}') truncate the body and let the parity checks pass
  // on incomplete data — fail loudly instead of silently.
  if (body.includes('{')) {
    throw new Error(`blockBody: nested braces under ${opener} — extend the parser to handle nested rules`)
  }
  return body
}

/** Custom-property names declared in a block body (without the leading `--`). */
function declaredVars(body: string): Set<string> {
  return new Set([...body.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]))
}

/** `--color-x` bridge entries → bare semantic name `x`. */
function bridgedColorTokens(themeInlineBody: string): string[] {
  return [...themeInlineBody.matchAll(/--color-([\w-]+)\s*:/g)].map((m) => m[1])
}

/** Literal value of a custom property declared in a block body. */
function declaredValue(body: string, name: string): string {
  const match = body.match(new RegExp(`--${name}\\s*:\\s*([^;]+);`))
  if (!match?.[1]) {
    throw new Error(`--${name} not declared`)
  }
  return match[1].trim()
}

describe('shared token cross-platform parity', () => {
  it('native light and dark themes declare the identical variable set (uniwind requirement)', () => {
    const light = declaredVars(blockBody(nativeCss, /@variant\s+light\s*{/))
    const dark = declaredVars(blockBody(nativeCss, /@variant\s+dark\s*{/))
    expect([...light].sort()).toEqual([...dark].sort())
  })

  it('native exposes exactly the Mycelium semantic color utilities', () => {
    const nativeInline = blockBody(nativeCss, /@theme\s+inline\s*{/)
    const nativeColors = bridgedColorTokens(nativeInline).sort()
    expect(nativeColors).toEqual(MYCELIUM_SEMANTIC_COLORS)
  })

  it('web :root defines every Mycelium semantic alias', () => {
    const webRoot = declaredVars(blockBody(variablesCss, /:root\s*{/))
    for (const token of MYCELIUM_SEMANTIC_COLORS) {
      expect(webRoot, `web :root missing --${token}`).toContain(token)
    }
  })

  it('every Mycelium color utility on native also exists on web', () => {
    const webInline = blockBody(variablesCss, /@theme\s+inline\s*{/)
    const webColors = new Set(bridgedColorTokens(webInline))
    for (const token of MYCELIUM_SEMANTIC_COLORS) {
      expect(webColors, `web @theme inline missing --color-${token}`).toContain(token)
    }
  })

  // accent3 is a deprecated alias of neutral1. Web runtime resolves it via
  // `var(--neutral1)` so it tracks neutral1 automatically, but theme.css must
  // duplicate the literals (native pipeline / token parsers need them), and the
  // palette drift ledger reads only those literals — if neutral1's literals
  // changed, stale accent3 copies would NOT resurface any INTENTIONAL_DRIFT pin.
  // This pins the alias claim for the literals' remaining lifetime.
  it('theme.css accent3 literals equal the neutral1 literals they alias', () => {
    const themeBody = blockBody(themeCss, /@theme\s*{/)
    for (const variant of ['light', 'dark', 'hovered-light', 'hovered-dark']) {
      expect(
        declaredValue(themeBody, `color-accent3-${variant}`),
        `--color-accent3-${variant} must stay a literal copy of --color-neutral1-${variant}`,
      ).toBe(declaredValue(themeBody, `color-neutral1-${variant}`))
    }
  })
})
