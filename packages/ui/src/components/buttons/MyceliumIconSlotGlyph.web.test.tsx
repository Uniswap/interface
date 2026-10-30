// The mycelium Button/IconButton icon slots vs a `ui/src` createIcon glyph — the
// SwapErrorScreen.tsx shape, where the glyph comes from `ui/src` and the button from
// mycelium. A bare `<svg>` cannot stand in: it carries no inline box, so the wrapper's
// `[&_svg]:size-*` class alone sizes it and the test passes with or without the clone.
// A real glyph carries createIcon's inline `$icon.8` box, which beats that class.
import { render, type RenderResult } from '@testing-library/react'
import { Button, IconButton } from '@universe/mycelium'
import { ICON_BUTTON_ICON_SIZE_PX } from '@universe/mycelium/button-frame-compat'
import { describe, expect, it, vi } from 'vitest'

// expo-blur arrives transitively and its native view manager is unavailable under jsdom.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { Faceid } from 'ui/src/components/icons/Faceid'
import { SharedUIUniswapProvider } from 'ui/src/test/render'

const GLYPH = 'slot-glyph'

/** The button label lane's box, per size — mirrors the compat's `ICON_SIZE_PX` (no public export). */
const BUTTON_LABEL_ICON_SIZE_PX = { xxsmall: 13.8, xsmall: 16.1, small: 16.1, medium: 20.7, large: 20.7 } as const

function glyphStyle(rendered: RenderResult): CSSStyleDeclaration {
  const element = rendered.container.querySelector<SVGSVGElement>(`[data-testid="${GLYPH}"]`)
  if (!element) {
    throw new Error('no glyph rendered inside the button')
  }
  return element.style
}

describe('mycelium Button.Icon sizes a ui/src glyph', () => {
  it.each(['xxsmall', 'medium', 'large'] as const)('%s: the glyph takes the label lane box, not 8px', (size) => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <Button size={size} icon={<Faceid testID={GLYPH} />}>
          Get help
        </Button>
      </SharedUIUniswapProvider>,
    )
    const style = glyphStyle(rendered)
    expect(style.width).toBe(`${BUTTON_LABEL_ICON_SIZE_PX[size]}px`)
    expect(style.height).toBe(`${BUTTON_LABEL_ICON_SIZE_PX[size]}px`)
    // The createIcon default that used to win.
    expect(style.width).not.toBe('8px')
  })

  it('a defaultFill glyph inherits the button text colour instead of its baked fill', () => {
    const bare = render(
      <SharedUIUniswapProvider>
        <AlertCircleFilled testID={GLYPH} />
      </SharedUIUniswapProvider>,
    )
    // Positive control: standalone, the glyph really does bake a concrete fill in.
    const baked = glyphStyle(bare).color
    expect(baked).not.toBe('')
    expect(baked.toLowerCase()).not.toBe('currentcolor')
    bare.unmount()

    const rendered = render(
      <SharedUIUniswapProvider>
        <Button icon={<AlertCircleFilled testID={GLYPH} />}>Get help</Button>
      </SharedUIUniswapProvider>,
    )
    expect(glyphStyle(rendered).color.toLowerCase()).toBe('currentcolor')
  })

  it("a caller's explicit glyph colour still wins", () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <Button icon={<Faceid testID={GLYPH} color="$statusCritical" />}>Get help</Button>
      </SharedUIUniswapProvider>,
    )
    expect(glyphStyle(rendered).color.toLowerCase()).not.toBe('currentcolor')
  })
})

describe('mycelium IconButton sizes a ui/src glyph', () => {
  it.each(['xxsmall', 'small', 'medium'] as const)('%s: the glyph takes the icon lane box, not 8px', (size) => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <IconButton size={size} icon={<Faceid testID={GLYPH} />} />
      </SharedUIUniswapProvider>,
    )
    const style = glyphStyle(rendered)
    expect(style.width).toBe(`${ICON_BUTTON_ICON_SIZE_PX[size]}px`)
    expect(style.height).toBe(`${ICON_BUTTON_ICON_SIZE_PX[size]}px`)
    expect(style.width).not.toBe('8px')
  })

  // The Button lane's colour cell above, on this lane: a near-black baked fill is
  // invisible against a dark-theme button.
  it('a defaultFill glyph inherits the button text colour instead of its baked fill', () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <IconButton icon={<AlertCircleFilled testID={GLYPH} />} />
      </SharedUIUniswapProvider>,
    )
    expect(glyphStyle(rendered).color.toLowerCase()).toBe('currentcolor')
  })
})
