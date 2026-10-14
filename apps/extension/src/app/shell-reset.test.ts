import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Extension shell reset contract.
 *
 * src/app/tailwind.css deliberately imports Tailwind without its preflight, so
 * the `@layer base` reset in Global.css is the only thing standing between the
 * UI and Chrome's user-agent styles — without it a bare <button> (every
 * SegmentedControl option) paints its UA border and fill. It must stay layered:
 * an unlayered reset would outrank the Tailwind utilities every component emits
 * onto those same tags.
 *
 * The contract below is keyed by selector, not by rule text, so regrouping the
 * rules or adding a tag to one (`select`, say — deliberately absent today, see
 * Global.css) leaves it passing. Expected values are independent literals, not
 * derived from the stylesheet.
 */

const appDir = dirname(fileURLToPath(import.meta.url))
const globalCss = readFileSync(join(appDir, 'Global.css'), 'utf8')
const skeletonBoxCss = readFileSync(join(appDir, 'components', 'loading', 'SkeletonBox.css'), 'utf8')

function baseLayerBlock(css: string): string {
  const start = css.indexOf('@layer base {')
  if (start === -1) {
    throw new Error('Global.css declares no @layer base reset')
  }
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') {
      depth++
    } else if (css[i] === '}') {
      depth--
      if (depth === 0) {
        return css.slice(start, i + 1)
      }
    }
  }
  throw new Error('unterminated @layer base block in Global.css')
}

/** Every declaration the base layer applies to one selector, merged across the rules that list it. */
function declarationsFor(selector: string): Map<string, string> {
  const body = baseLayerBlock(globalCss).replace(/\/\*[\s\S]*?\*\//g, '')
  const merged = new Map<string, string>()
  for (const [, selectors = '', declarations = ''] of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some((one) => one.trim() === selector)) {
      continue
    }
    for (const declaration of declarations.split(';')) {
      const [property, ...value] = declaration.split(':')
      if (property !== undefined && value.length > 0) {
        merged.set(property.trim(), value.join(':').trim())
      }
    }
  }
  return merged
}

const FORM_CONTROL_RESET: Record<string, string> = {
  'border-width': '0',
  // Width alone leaves the UA `outset`/`inset` style for a later width utility to paint.
  'border-style': 'solid',
  padding: '0',
  'background-color': 'transparent',
  font: 'inherit',
  // The `font` shorthand resets these two, so they need their own inherits.
  'font-feature-settings': 'inherit',
  'font-variant-ligatures': 'inherit',
  color: 'inherit',
}

/** The stylesheet with every `@… { … }` block (layers, keyframes) removed, leaving only unlayered rules. */
function withoutAtRuleBlocks(css: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    const at = css.indexOf('@', i)
    const open = at === -1 ? -1 : css.indexOf('{', at)
    const semi = at === -1 ? -1 : css.indexOf(';', at)
    if (at === -1 || open === -1) {
      out += css.slice(i)
      break
    }
    // An at-statement (`@layer a, b;`) has no block: skip it and keep scanning.
    if (semi !== -1 && semi < open) {
      out += css.slice(i, at)
      i = semi + 1
      continue
    }
    out += css.slice(i, at)
    let depth = 0
    for (i = open; i < css.length; i++) {
      if (css[i] === '{') {
        depth++
      } else if (css[i] === '}' && --depth === 0) {
        i++
        break
      }
    }
  }
  return out
}

/** Every declaration Global.css applies to one selector outside any at-rule block. */
function unlayeredDeclarationsFor(selector: string): Map<string, string> {
  const body = withoutAtRuleBlocks(globalCss.replace(/\/\*[\s\S]*?\*\//g, ''))
  const merged = new Map<string, string>()
  for (const [, selectors = '', declarations = ''] of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some((one) => one.trim() === selector)) {
      continue
    }
    for (const declaration of declarations.split(';')) {
      const [property, ...value] = declaration.split(':')
      if (property !== undefined && value.length > 0) {
        merged.set(property.trim(), value.join(':').trim())
      }
    }
  }
  return merged
}

const LIST_RESET: Record<string, string> = { margin: '0', padding: '0', 'list-style': 'none' }
const MARGIN_RESET: Record<string, string> = { margin: '0' }

describe('Global.css shell reset', () => {
  it.each([
    ['*', { 'box-sizing': 'border-box' }],
    ['h1', MARGIN_RESET],
    ['h6', MARGIN_RESET],
    ['p', MARGIN_RESET],
    ['pre', MARGIN_RESET],
    ['ul', LIST_RESET],
    ['ol', LIST_RESET],
    ['button', FORM_CONTROL_RESET],
    ['input', FORM_CONTROL_RESET],
    ['textarea', FORM_CONTROL_RESET],
    ['dialog', FORM_CONTROL_RESET],
    ['a', { color: 'inherit' }],
  ])('resets %s', (selector, expected) => {
    const declared = declarationsFor(selector)
    for (const [property, value] of Object.entries(expected)) {
      expect({ selector, property, value: declared.get(property) }).toEqual({ selector, property, value })
    }
  })

  // Every UI entrypoint's shell module pulls the stylesheet in; #40548 removed a
  // reset by deleting an import, so the assertions above are only worth
  // anything while these hold. Guards the import's existence only — whether the
  // compiled base layer lands in the right order needs the built CSS, which
  // this suite does not read.
  it.each(['SidebarApp', 'OnboardingApp', 'PopupApp', 'UnitagClaimApp'])('is imported by %s', (shellModule) => {
    const source = readFileSync(join(appDir, 'core', `${shellModule}.tsx`), 'utf8')
    expect(source).toMatch(/^import 'src\/app\/Global\.css'$/m)
  })

  it('keeps the reset layered so utilities still win', () => {
    expect(globalCss).toMatch(/@layer theme,\s*base,\s*components,\s*utilities;/)
    expect(globalCss.indexOf('@layer theme,')).toBeLessThan(globalCss.indexOf('@layer base {'))
  })

  // @universe/tailwind's base layer paints html/body with the shadcn
  // `--background` placeholder (near-black in dark mode, not $surface1). The
  // page background must stay unlayered to outrank it and must read the
  // theme-reactive `--surface1`, which is what flips with html.dark.
  it.each(['html', 'body'])('paints %s with the app surface, unlayered', (selector) => {
    expect(unlayeredDeclarationsFor(selector).get('background-color')).toBe('var(--surface1)')
    expect(declarationsFor(selector).has('background-color')).toBe(false)
  })

  // #root is a flex container; without a column direction the screen wrapper
  // is stretched to exactly 100vh and its content overflows past it.
  it('stacks #root as a column, unlayered', () => {
    const root = unlayeredDeclarationsFor('#root')
    expect(root.get('display')).toBe('flex')
    expect(root.get('flex-direction')).toBe('column')
    expect(declarationsFor('#root').has('flex-direction')).toBe(false)
  })

  // The theme is html.dark (applyInitialThemeClass / TailwindThemeSync); the
  // Tamagui `.t_light` / `.t_dark` classes are never applied any more, so a
  // rule keyed on them is dead.
  it.each([
    ['Global.css', globalCss],
    ['SkeletonBox.css', skeletonBoxCss],
  ])('%s keys nothing on the removed Tamagui theme classes', (_file, css) => {
    expect(css).not.toMatch(/\.t_(light|dark)\b/)
  })

  it('themes the skeleton shimmer off html.dark', () => {
    expect(skeletonBoxCss).toMatch(/^\.dark \.skeleton-box::after \{/m)
  })
})
