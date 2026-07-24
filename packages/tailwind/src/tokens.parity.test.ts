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
// (shadcn compat tokens are web-only Radix concerns and intentionally excluded.)
const MYCELIUM_SEMANTIC_COLORS = [
  'surface1',
  'surface2',
  'surface3',
  'surface4',
  'surface5',
  'neutral1',
  'neutral2',
  'neutral3',
  'accent1',
  'accent2',
  'success',
  'warning',
  'critical',
].sort()

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const variablesCss = readFileSync(join(pkgRoot, 'css', 'variables.css'), 'utf8')
const nativeCss = readFileSync(join(pkgRoot, 'native.css'), 'utf8')

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
})
