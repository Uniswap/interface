/**
 * Anchor color contract (INFRA-3115 QA finding F1): a Text rendered as an
 * anchor must carry its resolved base color on the style attribute — legacy
 * apps keep an unlayered global `a { color }` that beats every
 * `@layer utilities` class, and the legacy Tamagui Anchor (unlayered atomic
 * CSS) always painted its own color over it. Assertions read the serialized
 * markup (renderToStaticMarkup) because jsdom's CSSOM drops var()-valued
 * declarations (see createIcon.test.tsx precedent).
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'
import { groupStatePropKey } from '../compat/group'
import { PSEUDO_STYLE_KEYS, PSEUDO_VARIANT, type PseudoStyleKey } from '../compat/pseudo'
import { ANCHOR_BASE_VAR, ANCHOR_PSEUDO_CODE, anchorPseudoVar } from './anchor-vars'
import type { TextCompatProps } from './props'
import { TextCompat } from './TextCompat.web'

const MYCELIUM_ROOT = join(__dirname, '..', '..')
const requireFromHere = createRequire(__filename)

const TAILWIND_ONLY_ENTRY = '@import "tailwindcss" source(none);\n'

async function loadStylesheet(id: string, base: string): Promise<{ content: string; base: string; path: string }> {
  const path = id.startsWith('.')
    ? resolve(base, id)
    : id === 'tailwindcss'
      ? requireFromHere.resolve('tailwindcss/index.css')
      : requireFromHere.resolve(id)
  return { content: readFileSync(path, 'utf8'), base: dirname(path), path }
}

function renderedTag(props: TextCompatProps, children = 'Learn more'): string {
  const markup = renderToStaticMarkup(<TextCompat {...props}>{children}</TextCompat>)
  const tag = /<[a-z0-9]+\b[^>]*>/.exec(markup)?.[0]
  if (tag === undefined) {
    throw new Error(`expected a rendered element, got ${markup}`)
  }
  return tag
}

function styleDecl(tag: string, prop: string): string {
  const style = /\sstyle="([^"]*)"/.exec(tag)?.[1] ?? ''
  return new RegExp(`(?:^|;)\\s*${prop}:\\s*([^;]+)`).exec(style)?.[1]?.trim() ?? ''
}

describe('TextCompat anchor inline color', () => {
  it('carries an explicit color token as an inline declaration on tag="a"', () => {
    const tag = renderedTag({ tag: 'a', href: 'https://example.com', color: '$neutral1' })
    expect(tag).toContain('<a ')
    expect(styleDecl(tag, 'color')).toBe('var(--stext-neutral1)')
  })

  it('carries the $neutral1 default the same way when no color prop is given', () => {
    const tag = renderedTag({ tag: 'a', href: 'https://example.com' })
    expect(styleDecl(tag, 'color')).toBe('var(--stext-neutral1)')
  })

  it('passes raw CSS colors through verbatim', () => {
    const tag = renderedTag({ tag: 'a', color: 'red' })
    expect(styleDecl(tag, 'color')).toBe('red')
  })

  it('keeps the color class emission unchanged (inline is additive, classes stay the source of truth)', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1' })
    expect(tag).toContain('[color:var(--stext-neutral1)]')
  })

  it('does not inline color on non-anchor tags', () => {
    const tag = renderedTag({ color: '$neutral1' })
    expect(tag).toContain('<span')
    expect(styleDecl(tag, 'color')).toBe('')
  })

  it('routes a pseudo-recoloring anchor through the marked var lane', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', hoverStyle: { color: '$accent1' } })
    expect(styleDecl(tag, 'color')).toBe('')
    expect(tag).toContain('data-stext-anchor="h"')
    expect(styleDecl(tag, '--stext-a-col')).toBe('var(--stext-neutral1)')
    expect(styleDecl(tag, '--stext-a-col-h')).toBe('var(--stext-accent1)')
  })

  it('lists only the pools that recolor, so no undeclared pool repaints the base color', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', hoverStyle: { color: '$accent1' } })
    expect(tag).toContain('data-stext-anchor="h"')
    for (const code of ['a', 'f', 'v', 'w', 'd']) {
      expect(styleDecl(tag, `--stext-a-col-${code}`)).toBe('')
    }
  })

  it('gives each recoloring pool its own code and var', () => {
    const tag = renderedTag({
      tag: 'a',
      color: '$neutral1',
      hoverStyle: { color: '$accent1' },
      focusStyle: { color: '$accent2' },
    })
    expect(tag).toContain('data-stext-anchor="h f"')
    expect(styleDecl(tag, '--stext-a-col-h')).toBe('var(--stext-accent1)')
    expect(styleDecl(tag, '--stext-a-col-f')).toBe('var(--stext-accent2)')
    expect(styleDecl(tag, '--stext-a-col-v')).toBe('')
  })

  it('does not mark the var lane when no pseudo pool re-colors (the plain inline lane stands)', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1' })
    expect(tag).not.toContain('data-stext-anchor')
    expect(styleDecl(tag, '--stext-a-col')).toBe('')
  })

  it('resolves a non-string pool color exactly as the class lane does', () => {
    const tag = renderedTag({
      tag: 'a',
      color: '$neutral1',
      hoverStyle: { color: 4278190335 },
    } as unknown as TextCompatProps)
    expect(tag).toContain('data-stext-anchor="h"')
    expect(styleDecl(tag, '--ch-col')).toBe('var(--stext-transparent)')
    expect(styleDecl(tag, '--stext-a-col-h')).toBe('var(--stext-transparent)')
    expect(styleDecl(tag, '--stext-a-col')).toBe('var(--stext-neutral1)')
  })

  it('keeps the var lane for a Variable pool color (a legal ColorValue, not a bad value)', () => {
    const tag = renderedTag({
      tag: 'a',
      color: '$neutral1',
      hoverStyle: { color: { isVar: true, val: '#ff0000', name: 'linkHover' } },
    } as unknown as TextCompatProps)
    expect(tag).toContain('data-stext-anchor="h"')
    expect(styleDecl(tag, '--stext-a-col')).toBe('var(--stext-neutral1)')
    expect(styleDecl(tag, '--stext-a-col-h')).toBe('#ff0000')
  })

  it('forceStyle keeps both lanes suppressed (a forced pool has no attribute-selector twin)', () => {
    const tag = renderedTag({
      tag: 'a',
      color: '$neutral1',
      hoverStyle: { color: '$accent1' },
      forceStyle: 'hover',
    })
    expect(styleDecl(tag, 'color')).toBe('')
    expect(tag).not.toContain('data-stext-anchor')
  })

  it('skips both anchor color lanes when a media pool re-colors the element', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', $md: { color: '$accent1' } })
    expect(styleDecl(tag, 'color')).toBe('')
    expect(tag).not.toContain('data-stext-anchor')
  })

  it('skips both anchor color lanes when a pseudo pool NESTED in a media pool re-colors the element', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', $md: { hoverStyle: { color: '$accent1' } } })
    expect(styleDecl(tag, 'color')).toBe('')
  })

  it('skips both anchor color lanes when a theme pool (or its nested pseudo pool) re-colors the element', () => {
    expect(
      styleDecl(renderedTag({ tag: 'a', color: '$neutral1', '$theme-dark': { color: '$accent1' } }), 'color'),
    ).toBe('')
    expect(
      styleDecl(
        renderedTag({ tag: 'a', color: '$neutral1', '$theme-light': { pressStyle: { color: '$accent1' } } }),
        'color',
      ),
    ).toBe('')
  })

  it('skips both anchor color lanes when a group pool re-colors the element', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', [groupStatePropKey('hover')]: { color: '$accent1' } })
    expect(styleDecl(tag, 'color')).toBe('')
  })

  it('keeps the inline color when only a native-only platform pool carries a color (web never compiles it)', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', '$platform-ios': { color: '$accent1' } })
    expect(styleDecl(tag, 'color')).toBe('var(--stext-neutral1)')
  })

  it('keeps the inline color when a pool color is undefined (the compiler emits nothing for it)', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', hoverStyle: { color: undefined } })
    expect(styleDecl(tag, 'color')).toBe('var(--stext-neutral1)')
  })

  it('lets a caller style declaration win over the anchor color', () => {
    const tag = renderedTag({ tag: 'a', color: '$neutral1', style: { color: 'blue' } })
    expect(styleDecl(tag, 'color')).toBe('blue')
  })
})

describe('anchor var lane vocabulary', () => {
  const stylesheet = readFileSync(join(__dirname, 'text-compat.css'), 'utf8')

  it('every pool code has a gated rule and a matching var in text-compat.css', () => {
    expect(stylesheet).toContain(`a[data-stext-anchor][data-stext-anchor] {\n  color: var(${ANCHOR_BASE_VAR});\n}`)
    for (const code of Object.values(ANCHOR_PSEUDO_CODE)) {
      expect(stylesheet, `no rule gated on pool code '${code}'`).toContain(`a[data-stext-anchor~='${code}']`)
      expect(stylesheet, `${anchorPseudoVar(code)} is never read`).toContain(`var(${anchorPseudoVar(code)})`)
    }
  })

  it('no anchor rule is left ungated on a pseudo-class', () => {
    const ungated = stylesheet
      .split('\n')
      .filter((line) => /^\s*a(?:\[data-stext-anchor\])+(?::|\[(?!data-stext-anchor\]))/.test(line))
    expect(ungated, `ungated anchor rule(s):\n${ungated.join('\n')}`).toHaveLength(0)
  })

  function poolAt(code: string): number {
    const at = stylesheet.indexOf(`a[data-stext-anchor~='${code}']`)
    expect(at, `no gated rule for pool code '${code}'`).toBeGreaterThan(-1)
    return at
  }

  describe("against Tailwind's actual emission", () => {
    let emittedPoolOrder: string[] = []
    let tailwindWrapsHoverInMedia = false

    beforeAll(async () => {
      const compiler = await compile(TAILWIND_ONLY_ENTRY, { base: MYCELIUM_ROOT, loadStylesheet })
      // Reversed so the emitted order cannot just be echoing the order handed in.
      const keys = [...PSEUDO_STYLE_KEYS].reverse()
      const css = compiler.build(keys.map((key) => `${PSEUDO_VARIANT[key]}:[color:var(--probe-${key})]`))
      const seen: PseudoStyleKey[] = []
      for (const match of css.matchAll(/var\(--probe-([A-Za-z]+)\)/g)) {
        const key = match[1] as PseudoStyleKey
        if (!seen.includes(key)) {
          seen.push(key)
        }
      }
      emittedPoolOrder = seen.map((key) => ANCHOR_PSEUDO_CODE[key])
      tailwindWrapsHoverInMedia = /@media\s*\(hover:\s*hover\)/.test(
        compiler.build([`${PSEUDO_VARIANT.hoverStyle}:[color:var(--probe-hover-only)]`]),
      )
    }, 120_000)

    it('saw every variant emitted (a short read would pass the order check vacuously)', () => {
      expect(emittedPoolOrder).toHaveLength(PSEUDO_STYLE_KEYS.length)
      expect([...emittedPoolOrder].sort()).toEqual(Object.values(ANCHOR_PSEUDO_CODE).sort())
    })

    it('lists the state rules in the order Tailwind emits them, so ties resolve like the class lane', () => {
      const actual = emittedPoolOrder
        .map((code) => ({ code, at: poolAt(code) }))
        .sort((l, r) => l.at - r.at)
        .map(({ code }) => code)
      expect(
        actual,
        `state rules are in the wrong source order.\nTailwind emits (weakest first): ${emittedPoolOrder.join(', ')}\n` +
          `text-compat.css has:            ${actual.join(', ')}`,
      ).toEqual(emittedPoolOrder)
    })

    it('wraps the hover rule in @media (hover: hover) exactly when Tailwind does', () => {
      const wrapped = /@media \(hover: hover\) \{\s*a\[data-stext-anchor~='h'\]:hover/.test(stylesheet)
      expect(wrapped, `Tailwind wraps hover: ${tailwindWrapsHoverInMedia}; text-compat.css wraps: ${wrapped}`).toBe(
        tailwindWrapsHoverInMedia,
      )
    })
  })

  it('hoverStyle + focusWithinStyle: hover still wins once the link is focused', () => {
    expect(poolAt('h'), 'hover must follow focus-within').toBeGreaterThan(poolAt('w'))
  })

  it('pressStyle + focusStyle: press wins while the link is pressed', () => {
    expect(poolAt('a'), 'active must follow focus').toBeGreaterThan(poolAt('f'))
    expect(poolAt('a'), 'active must follow focus-visible').toBeGreaterThan(poolAt('v'))
  })
})
