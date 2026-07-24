import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Extension font contract.
 *
 * Two font families must resolve on every extension UI page:
 *   - "Basel Grotesk" — requested by the shared Tailwind base layer
 *     (packages/tailwind/css/base.css applies `font-basel`, which theme.css
 *     resolves to "Basel Grotesk").
 *   - "Basel" — requested by Tamagui text (ui/src/theme/fonts.ts, web branch)
 *     at weights 400/500.
 *
 * Both must be backed by the licensed Basel Grotesk sources from
 * packages/tailwind/fonts. The pre-license 2019 dev cut of the font (the old
 * src/public/assets/fonts/Basel-{Book,Medium}.woff files registered by each
 * entrypoint's index.html) must not come back: it has broken vertical metrics
 * and is missing 159 glyphs, and the unlayered `* { font-family }` rules that
 * loaded it silently overrode the layered Tailwind base on every element.
 */

const extensionRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const tailwindPkgRoot = join(extensionRoot, '..', '..', 'packages', 'tailwind')

const appTailwindCss = readFileSync(join(extensionRoot, 'src', 'app', 'tailwind.css'), 'utf8')
const themeCss = readFileSync(join(tailwindPkgRoot, 'css', 'theme.css'), 'utf8')
const sharedFontsCss = readFileSync(join(tailwindPkgRoot, 'css', 'fonts.css'), 'utf8')

const ENTRYPOINT_HTML_PATHS = ['sidepanel', 'onboarding', 'fallback-popup', 'unitagClaim'].map((entry) =>
  join(extensionRoot, 'src', 'entrypoints', entry, 'index.html'),
)

function fontFaceBlocks(css: string): string[] {
  return [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map((match) => match[0])
}

function familyOf(block: string): string | undefined {
  return block.match(/font-family:\s*["']([^"']+)["']/)?.[1]
}

describe('extension font registration', () => {
  it('loads the @font-face family that the shared Tailwind base layer requests', () => {
    const baseFamily = themeCss.match(/--font-basel:\s*["']([^"']+)["']/)?.[1]
    expect(baseFamily, 'packages/tailwind/css/theme.css must define --font-basel').toBeTruthy()

    // The shared fonts stylesheet registers that family…
    const sharedFamilies = fontFaceBlocks(sharedFontsCss).map(familyOf)
    expect(sharedFamilies).toContain(baseFamily)

    // …and the extension actually imports it.
    expect(appTailwindCss).toMatch(/@import\s+["']@universe\/tailwind\/(css\/)?fonts(\.css)?["']/)
  })

  it('aliases the Tamagui "Basel" family (weights 400/500) to the licensed Basel Grotesk sources', () => {
    const baselFaces = fontFaceBlocks(appTailwindCss).filter((block) => familyOf(block) === 'Basel')
    const weights = baselFaces.map((block) => block.match(/font-weight:\s*(\d+)/)?.[1]).sort()

    expect(weights).toEqual(['400', '500'])
    for (const block of baselFaces) {
      expect(block).toMatch(/Basel-Grotesk-(Book|Medium)\.woff2?/)
    }
  })

  it('re-asserts the base font on body outside of @layer', () => {
    // Chrome injects `body { font-family: <pref font>; font-size: 75% }` into
    // chrome-extension:// pages as an unlayered author style, which beats the
    // @layer base html/body rule — the override must stay unlayered.
    expect(appTailwindCss).toMatch(/^body\s*\{[^}]*font-family:\s*var\(--font-basel\)/m)
  })

  it('entrypoint HTML pages register no fonts and no unlayered font-family overrides', () => {
    for (const htmlPath of ENTRYPOINT_HTML_PATHS) {
      const html = readFileSync(htmlPath, 'utf8')
      // An unlayered `* { font-family }` in the page would beat every layered
      // Tailwind rule (cascade layers lose to unlayered styles), silently
      // re-breaking fonts for the whole page.
      expect(html, `${htmlPath} must not declare font-family`).not.toMatch(/font-family/)
      expect(html, `${htmlPath} must not reference the unlicensed dev fonts`).not.toMatch(/Basel-(Book|Medium)\.woff/)
    }
  })

  it('the unlicensed 2019 dev font files are gone', () => {
    for (const file of ['Basel-Book.woff', 'Basel-Medium.woff']) {
      expect(
        existsSync(join(extensionRoot, 'src', 'public', 'assets', 'fonts', file)),
        `${file} should be deleted`,
      ).toBe(false)
    }
  })
})
