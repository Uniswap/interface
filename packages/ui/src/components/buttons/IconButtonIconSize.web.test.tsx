import { render, type RenderResult } from '@testing-library/react'
// Pins the glyph box and colour the compat `IconButton` clones onto a `createIcon` glyph `icon`.
// The `[&_svg]:size-[<px>px]` wrapper class alone loses to the glyph's inline `width`/`height`
// default in a real browser — so without the clone every size renders the factory's `$icon.8` box. The expected boxes are read
// from the compat's own exported table, never transcribed.
import { IconButton } from '@universe/mycelium'
import { ICON_BUTTON_ICON_SIZE_PX } from '@universe/mycelium/button-frame-compat'
import { describe, expect, it, vi } from 'vitest'

// expo-blur arrives transitively and its native view manager is unavailable under jsdom.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { Faceid } from 'ui/src/components/icons/Faceid'
import { SharedUIUniswapProvider } from 'ui/src/test/render'

const SIZES = ['xxsmall', 'xsmall', 'small', 'medium', 'large'] as const

const GLYPH_TEST_ID = 'icon-button-glyph'

function glyph(rendered: RenderResult): HTMLElement {
  const element = rendered.container.querySelector<HTMLElement>(`[data-testid="${GLYPH_TEST_ID}"]`)
  if (!element) {
    throw new Error('no glyph rendered inside the icon button')
  }
  return element
}

/** The box `IconButton` CLONED onto the glyph, off the glyph's own resolved inline style. */
function clonedGlyphBoxPx(rendered: RenderResult): { width: number; height: number } {
  const element = glyph(rendered)
  const width = Number.parseFloat(element.style.width)
  const height = Number.parseFloat(element.style.height)
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`glyph carries no resolved inline box: ${JSON.stringify(element.getAttribute('style'))}`)
  }
  return { width, height }
}

function renderIconButtonWithGlyph(size: (typeof SIZES)[number]): RenderResult {
  return render(
    <SharedUIUniswapProvider>
      <IconButton size={size} icon={<Faceid testID={GLYPH_TEST_ID} />} />
    </SharedUIUniswapProvider>,
  )
}

describe("IconButton clones the compat's icon-lane box onto its glyph", () => {
  it.each(SIZES)('%s: the cloned box equals the compat size table entry', (size) => {
    const rendered = renderIconButtonWithGlyph(size)

    const expected = ICON_BUTTON_ICON_SIZE_PX[size]
    const cloned = clonedGlyphBoxPx(rendered)

    expect(cloned.width).toBe(expected)
    expect(cloned.height).toBe(expected)
  })

  // Guards the comparison itself: if the boxes ever stopped differing across sizes the per-size
  // cases above could all pass against one repeated number.
  it('the table is not one flat value across sizes', () => {
    const boxes = SIZES.map((size) => {
      const rendered = renderIconButtonWithGlyph(size)
      const box = clonedGlyphBoxPx(rendered).width
      rendered.unmount()
      return box
    })

    expect(new Set(boxes).size).toBeGreaterThan(1)
    expect(new Set(SIZES.map((size) => ICON_BUTTON_ICON_SIZE_PX[size])).size).toBeGreaterThan(1)
  })
})

describe('IconButton makes a defaultFill glyph inherit the button contrast colour', () => {
  it('renders the glyph as currentColor instead of its baked fill', () => {
    const bare = render(
      <SharedUIUniswapProvider>
        <AlertCircleFilled testID={GLYPH_TEST_ID} />
      </SharedUIUniswapProvider>,
    )
    // Positive control: outside a button the same glyph really does bake its defaultFill in,
    // so the assertion below is measuring the button's override and not an absent colour.
    const bakedFill = glyph(bare).style.color
    expect(bakedFill).not.toBe('')
    expect(bakedFill.toLowerCase()).not.toBe('currentcolor')
    bare.unmount()

    const rendered = render(
      <SharedUIUniswapProvider>
        <IconButton icon={<AlertCircleFilled testID={GLYPH_TEST_ID} />} />
      </SharedUIUniswapProvider>,
    )

    const inherited = glyph(rendered).style.color

    expect(inherited.toLowerCase()).toBe('currentcolor')
    expect(inherited).not.toBe(bakedFill)
  })

  it("keeps a caller's explicit colour on the glyph", () => {
    const rendered = render(
      <SharedUIUniswapProvider>
        <IconButton icon={<AlertCircleFilled testID={GLYPH_TEST_ID} color="$neutral2" />} />
      </SharedUIUniswapProvider>,
    )

    expect(glyph(rendered).style.color.toLowerCase()).not.toBe('currentcolor')
  })
})
