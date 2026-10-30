// Pins the box `ThemedIconCompat` clones onto a Button's glyph to the box it emits as the icon
// wrapper's `[&_svg]:size-[<px>px]` class. The size table (`button-compat/compile.ts`'s
// `ICON_SIZE_PX`) has no public subpath export, so the emitted class is read instead of the
// constant; the clone and the class drifting apart fails the comparison.
import { render, type RenderResult } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// expo-blur arrives transitively and its native view manager is unavailable under jsdom.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

import { Button } from 'ui/src/components/buttons/Button/Button'
import { Faceid } from 'ui/src/components/icons/Faceid'
import { SharedUIUniswapProvider } from 'ui/src/test/render'

const SIZES = ['xxsmall', 'xsmall', 'small', 'medium', 'large'] as const

const GLYPH_TEST_ID = 'button-label-glyph'

/** The box `ThemedIconCompat` CLONED onto the glyph, off the glyph's own resolved inline style. */
function clonedGlyphBoxPx(rendered: RenderResult): { width: number; height: number } {
  const glyph = rendered.container.querySelector<HTMLElement>(`[data-testid="${GLYPH_TEST_ID}"]`)
  if (!glyph) {
    throw new Error('no glyph rendered inside the button')
  }
  const width = Number.parseFloat(glyph.style.width)
  const height = Number.parseFloat(glyph.style.height)
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error(`glyph carries no resolved inline box: ${JSON.stringify(glyph.getAttribute('style'))}`)
  }
  return { width, height }
}

/** The box the COMPAT emits, off its `[&_svg]:size-[<px>px]` wrapper class. */
function compatWrapperBoxPx(rendered: RenderResult): number {
  const glyph = rendered.container.querySelector<HTMLElement>(`[data-testid="${GLYPH_TEST_ID}"]`)
  const wrapper = glyph?.closest('span')
  if (!wrapper) {
    throw new Error('the glyph is not wrapped in the themed icon span')
  }
  const sizeClasses = Array.from(wrapper.classList).filter((cls) => cls.startsWith('[&_svg]:size-['))
  if (sizeClasses.length !== 1) {
    throw new Error(`expected exactly one emitted glyph-box class, got ${JSON.stringify(sizeClasses)}`)
  }
  const px = /\[&_svg\]:size-\[([\d.]+)px\]/.exec(sizeClasses[0] as string)?.[1]
  if (px === undefined) {
    throw new Error(`emitted glyph-box class is not a px box: ${JSON.stringify(sizeClasses[0])}`)
  }
  return Number.parseFloat(px)
}

function renderButtonWithGlyph(size: (typeof SIZES)[number]): RenderResult {
  return render(
    <SharedUIUniswapProvider>
      <Button size={size} icon={<Faceid testID={GLYPH_TEST_ID} />}>
        label
      </Button>
    </SharedUIUniswapProvider>,
  )
}

describe("ThemedIconCompat's cloned glyph box tracks the compat's button-lane size table", () => {
  it.each(SIZES)('%s: the cloned box equals the box the compat emits', (size) => {
    const rendered = renderButtonWithGlyph(size)

    const emitted = compatWrapperBoxPx(rendered)
    const cloned = clonedGlyphBoxPx(rendered)

    expect(cloned.width).toBe(emitted)
    expect(cloned.height).toBe(emitted)
  })

  // Guards the comparison itself: if the sizes ever stopped differing between the lanes the
  // per-size cases above could all pass against one repeated number.
  it('the table is not one flat value across sizes', () => {
    const boxes = SIZES.map((size) => {
      const rendered = renderButtonWithGlyph(size)
      const box = clonedGlyphBoxPx(rendered).width
      rendered.unmount()
      return box
    })

    expect(new Set(boxes).size).toBeGreaterThan(1)
  })
})
