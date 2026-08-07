// @vitest-environment jsdom
/**
 * Caret default-color parity (INFRA-2956 review follow-up).
 *
 * The path-data suite deliberately normalizes root color away as a wrapper
 * concern, so nothing pinned Caret's default color. Legacy Caret defaults to
 * `$black`, which is theme-INVARIANT (#000000 in light and dark). This suite
 * renders the real legacy Caret in both themes, asserts the resolved default
 * is literal black in each, and pins mycelium's Caret to that same resolved
 * value — a `var()` reference would fail here, which is the point: an
 * undefined CSS variable in the svg `color` presentation attribute silently
 * degrades to the inherited text color (white in dark mode).
 */
import { createElement, type ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native-svg', async () => {
  const React = await import('react')
  const tags: Record<string, string> = { Svg: 'svg', Path: 'path', G: 'g', Defs: 'defs' }
  const out: Record<string, unknown> = {}
  for (const [name, tag] of Object.entries(tags)) {
    const comp = React.forwardRef<unknown, Record<string, unknown>>((props, ref) =>
      React.createElement(tag, { ...props, ref }),
    )
    comp.displayName = name
    out[name] = comp
  }
  out.default = out.Svg
  return out
})

const BLACK = new Set(['#000000', '#000', 'rgb(0, 0, 0)', 'rgba(0, 0, 0, 1)'])

/**
 * The effective color declaration of the rendered icon: the svg `color`
 * presentation attribute (mycelium factory) or inline style color (legacy
 * react-native-web), whichever the implementation used.
 */
function resolvedIconColor(container: HTMLElement): string {
  const svg = container.querySelector('svg')
  if (!svg) {
    throw new Error('expected a rendered svg')
  }
  return svg.style.color || svg.getAttribute('color') || ''
}

async function renderLegacyCaret(theme: 'light' | 'dark'): Promise<string> {
  const { render } = await import('@testing-library/react')
  const { TamaguiProvider, createTamagui } = await import('ui/src')
  const { configWithoutAnimations } = await import('ui/src/theme/config')
  const { Caret } = await import('ui/src/components/icons/Caret')
  const config = createTamagui(configWithoutAnimations)
  const result = render(
    createElement(
      TamaguiProvider,
      { config, defaultTheme: theme },
      createElement(Caret as ComponentType<Record<string, unknown>>),
    ),
  )
  const color = resolvedIconColor(result.container)
  result.unmount()
  return color
}

describe('Caret default color parity', () => {
  it('legacy Caret resolves $black to literal black in BOTH themes (theme-invariant)', async () => {
    const light = await renderLegacyCaret('light')
    const dark = await renderLegacyCaret('dark')
    expect(BLACK.has(light), `legacy light resolved to ${JSON.stringify(light)}`).toBe(true)
    expect(BLACK.has(dark), `legacy dark resolved to ${JSON.stringify(dark)}`).toBe(true)
  })

  it('mycelium Caret renders the same resolved literal — never an unresolved var() reference', async () => {
    const { render } = await import('@testing-library/react')
    // nx-ignore-next-line
    const { Caret } = await import('../../../../mycelium/src/components/icons/Caret')
    const result = render(createElement(Caret))
    const color = resolvedIconColor(result.container)
    result.unmount()
    expect(BLACK.has(color), `mycelium resolved to ${JSON.stringify(color)}`).toBe(true)
    expect(color).not.toContain('var(')
  })
})
