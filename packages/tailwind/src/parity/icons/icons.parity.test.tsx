// @vitest-environment jsdom
/**
 * Icon pipeline parity suite (INFRA-2956).
 *
 * Exit tests for the mycelium icon pipeline, written BEFORE the pipeline
 * exists (proof-first — they must fail red until the generator lands):
 *
 *  1. Name parity — the mycelium icon barrel exports exactly the runtime
 *     export set of `ui/src/components/icons` (274 base icons plus their
 *     Animated twins; same names, nothing renamed).
 *  2. Path-data parity — all 274 base icons render the same meaningful SVG
 *     content as the legacy Tamagui icons after normalizing wrapper
 *     attributes (see ./contract.ts for what "wrapper" means).
 *
 * The legacy side renders the real `packages/ui` components under jsdom +
 * react-native-web inside a TamaguiProvider — nothing is re-derived by hand.
 * react-native-svg is mocked to plain DOM svg host elements (overriding the
 * div mock from vitest-setup.ts) so both sides serialize through React DOM
 * and attribute handling is identical.
 */
import { createElement, type ComponentType } from 'react'
import * as legacyIcons from 'ui/src/components/icons'
import { describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import * as myceliumIcons from '../../../../mycelium/src/components/icons'
import { deriveBaseIconNames, normalizeRenderedIcon, REQUIRED_RENDER_PROPS } from './contract'

vi.mock('react-native-svg', async () => {
  const React = await import('react')
  const tags: Record<string, string> = {
    Svg: 'svg',
    Circle: 'circle',
    Ellipse: 'ellipse',
    G: 'g',
    Text: 'text',
    TSpan: 'tspan',
    TextPath: 'textPath',
    Path: 'path',
    Polygon: 'polygon',
    Polyline: 'polyline',
    Line: 'line',
    Rect: 'rect',
    Use: 'use',
    Image: 'image',
    Symbol: 'symbol',
    Defs: 'defs',
    LinearGradient: 'linearGradient',
    RadialGradient: 'radialGradient',
    Stop: 'stop',
    ClipPath: 'clipPath',
    Pattern: 'pattern',
    Mask: 'mask',
    Marker: 'marker',
    ForeignObject: 'foreignObject',
  }
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

const legacyExportNames = Object.keys(legacyIcons).sort()
const myceliumExportNames = Object.keys(myceliumIcons).sort()
const baseIconNames = deriveBaseIconNames(legacyExportNames)

describe('icon name parity (mycelium barrel ≡ ui/src/components/icons)', () => {
  it('the ui icon surface is exactly 274 base icons', () => {
    expect(baseIconNames).toHaveLength(274)
  })

  it('mycelium exports exactly the same runtime name set — nothing renamed, nothing missing, nothing extra', () => {
    expect(myceliumExportNames).toEqual(legacyExportNames)
  })
})

describe('icon path-data parity (rendered SVG content, wrapper attributes normalized)', () => {
  it.each(baseIconNames)('%s renders identical SVG content on both sides', async (name) => {
    const LegacyIcon = (legacyIcons as Record<string, unknown>)[name] as ComponentType<Record<string, unknown>>
    const MyceliumIcon = (myceliumIcons as Record<string, unknown>)[name] as
      | ComponentType<Record<string, unknown>>
      | undefined
    expect(MyceliumIcon, `mycelium is missing an export for ${name}`).toBeDefined()

    const props = REQUIRED_RENDER_PROPS[name] ?? {}

    const { render } = await import('@testing-library/react')
    const { TamaguiProvider, createTamagui } = await import('ui/src')
    const { configWithoutAnimations } = await import('ui/src/theme/config')
    const config = createTamagui(configWithoutAnimations)

    const legacy = render(
      createElement(TamaguiProvider, { config, defaultTheme: 'light' }, createElement(LegacyIcon, props)),
    )
    const legacyTree = normalizeRenderedIcon(legacy.container)
    legacy.unmount()

    const mycelium = render(createElement(MyceliumIcon as ComponentType<Record<string, unknown>>, props))
    const myceliumTree = normalizeRenderedIcon(mycelium.container)
    mycelium.unmount()

    expect(myceliumTree).toEqual(legacyTree)
  })
})
