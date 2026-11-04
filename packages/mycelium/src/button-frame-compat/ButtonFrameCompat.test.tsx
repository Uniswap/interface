import { renderToStaticMarkup } from 'react-dom/server'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import { cn } from '../cn'
import { ButtonFrameCompat } from './ButtonFrameCompat.web'
import { ButtonTextCompat } from './ButtonTextCompat.web'
import { buttonFrameOpenEmission, ICON_BUTTON_SIZE_CLASSES } from './compile'
import { ThemedIconCompat } from './ThemedIconCompat.web'

// jsdom CSSOM drops var() styles; assert on the static markup string instead.
const frameClassesOf = (markup: string): string[] => {
  const match = /class="([^"]*)"/.exec(markup)
  return match?.[1]?.split(' ') ?? []
}

describe('ButtonFrameCompat (web) — closed variant surface', () => {
  it('renders the parity-proven ButtonCompat frame cell for the resolved selection', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat variant="critical" emphasis="primary" />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('bg-critical')
    expect(classes).toContain('hover:bg-critical-hovered')
    // medium size cell
    expect(classes).toContain('px-4')
    expect(classes).toContain('py-3')
  })

  it('paints the disabled cell and blocks interaction when isDisabled (no onDisabledPress)', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat isDisabled />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('bg-surface2')
    expect(classes).toContain('pointer-events-none')
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('tabindex="-1"')
  })

  it('keeps the button interactive while disabled-looking when onDisabledPress is set', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat isDisabled onDisabledPress={() => {}} />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('bg-surface2')
    expect(classes).not.toContain('pointer-events-none')
    expect(markup).not.toContain('disabled=""')
  })
})

describe('ButtonFrameCompat (web) — open legacy style-prop lane', () => {
  it('compiles open style props and merges them AFTER the variant cell (prop beats variant)', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat variant="default" backgroundColor="$accent1" />)
    const classes = frameClassesOf(markup)
    // The token background must override the default cell's bg-neutral1 in the merge.
    expect(classes).toContain('bg-accent1')
    expect(classes).not.toContain('bg-neutral1')
  })

  it('compiles margins, responsive and pseudo pools through the emission engine', () => {
    const emission = buttonFrameOpenEmission({
      mt: '$spacing8',
      hoverStyle: { opacity: 0.5 },
      $md: { display: 'none' },
    })
    // Token margins resolve to their px arbitrary form (generated safelist);
    // pseudo/media pools ride safelisted var-indirection twins whose values
    // travel as inline custom properties (INFRA-3217 deterministic emission).
    expect(emission.className).toContain('mt-[8px]')
    expect(emission.className).toContain('hover:opacity-[var(--ch-opacity)]')
    expect(emission.className).toContain('media-md:[display:var(--cE-di)]')
    expect(emission.style).toMatchObject({ '--ch-opacity': '0.5', '--cE-di': 'none' })
  })

  it('keeps the caller className last in the merge', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat className="bg-surface3" />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('bg-surface3')
    expect(classes).not.toContain('bg-neutral1')
  })
})

describe('ButtonFrameCompat (web) — element boundary', () => {
  it('renders tag="a" + href as a real anchor (legacy link-button), not a <button>', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat tag="a" href="https://uniswap.org" />)
    expect(markup.startsWith('<a ')).toBe(true)
    expect(markup).toContain('href="https://uniswap.org"')
    expect(markup).not.toContain('type="button"')
  })

  it('disabled link-button matches legacy: href kept, blocked by pointer-events-none + tabindex -1', () => {
    // Legacy CustomButtonFrame.web.tsx's isDisabled variant (lines 198-208)
    // never strips href — it blocks the anchor with `$platform-web`
    // `pointerEvents: 'none'` (mouse) and `tabIndex: -1` (keyboard focus).
    // Parity over correctness: reproduce exactly that.
    const markup = renderToStaticMarkup(<ButtonFrameCompat tag="a" href="https://uniswap.org" isDisabled />)
    const classes = frameClassesOf(markup)
    expect(markup).toContain('href="https://uniswap.org"')
    expect(classes).toContain('pointer-events-none')
    expect(markup).toContain('tabindex="-1"')
    expect(markup).toContain('aria-disabled="true"')
    // No `disabled` DOM attribute on an anchor (invalid HTML), and no onclick.
    expect(markup).not.toContain('disabled=""')
  })

  it('forwards dd-action-name, testID and raw data-* to the DOM', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat dd-action-name="swap" testID="frame" data-loc="hero" />)
    expect(markup).toContain('dd-action-name="swap"')
    expect(markup).toContain('data-testid="frame"')
    expect(markup).toContain('data-loc="hero"')
  })

  it('takes the custom-background lane for a concrete hex color (inline style + brightness classes)', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat backgroundColor="#123456" />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('hover:brightness-125')
    expect(markup).toContain('background-color:#123456')
    expect(markup).toContain('border-color:#123456')
  })

  it('validates primary-color like legacy: hex/rgb colors the outline, anything else is dropped', () => {
    const hex = renderToStaticMarkup(<ButtonFrameCompat backgroundColor="#123456" primary-color="#ff0000" />)
    expect(hex).toContain('--sbtn-custom-outline:#ff0000')
    // A non-hex value (token, or anything unvalidated) must never be written
    // into the custom property — the background stays the outline fallback.
    const token = renderToStaticMarkup(<ButtonFrameCompat backgroundColor="#123456" primary-color="$accent1" />)
    expect(token).not.toContain('$accent1')
    expect(token).toContain('--sbtn-custom-outline:#123456')
  })

  it("keeps a caller's aria-disabled when the frame itself is not disabled", () => {
    // Pre-fix, the explicit `'aria-disabled': …: undefined` after the domProps
    // spread wiped the caller's value in the not-disabled case.
    const markup = renderToStaticMarkup(<ButtonFrameCompat aria-disabled={true} />)
    expect(markup).toContain('aria-disabled="true"')
    // And the frame's own disabled state still wins over a caller value.
    const disabled = renderToStaticMarkup(<ButtonFrameCompat isDisabled aria-disabled={false} />)
    expect(disabled).toContain('aria-disabled="true"')
  })

  it('never leaks RN handlers as DOM attributes; they remap onto their web seams', () => {
    const hoverIn = vi.fn()
    const pointerEnter = vi.fn()
    const pressIn = vi.fn()
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(<ButtonFrameCompat onHoverIn={hoverIn} onPointerEnter={pointerEnter} onPressIn={pressIn} />)
    })
    const button = tree.root.findByType('button' as never).props as Record<string, unknown>
    expect(button['onHoverIn']).toBeUndefined()
    expect(button['onPressIn']).toBeUndefined()
    expect(button['onLayout']).toBeUndefined()
    // onHoverIn rides onPointerEnter, chained with the caller's own handler.
    ;(button['onPointerEnter'] as (event: unknown) => void)({})
    expect(hoverIn).toHaveBeenCalledTimes(1)
    expect(pointerEnter).toHaveBeenCalledTimes(1)
    // onPressIn rides the mouse + touch pair (the Tamagui web seam).
    ;(button['onMouseDown'] as (event: unknown) => void)({})
    ;(button['onTouchStart'] as (event: unknown) => void)({})
    expect(pressIn).toHaveBeenCalledTimes(2)
  })
})

describe('ButtonTextCompat (web)', () => {
  it('reads the frame context for its cell (frame variant themes the label)', () => {
    const markup = renderToStaticMarkup(
      <ButtonFrameCompat variant="critical">
        <ButtonTextCompat>Delete</ButtonTextCompat>
      </ButtonFrameCompat>,
    )
    expect(markup).toContain('text-white')
  })

  it('pins a concrete hex color inline across states; a token colors normally', () => {
    const hex = renderToStaticMarkup(<ButtonTextCompat color="#ff0000">X</ButtonTextCompat>)
    expect(hex).toContain('color:#ff0000')
    const token = renderToStaticMarkup(<ButtonTextCompat color="$neutral2">X</ButtonTextCompat>)
    expect(token).toContain('text-neutral2')
  })

  it('drops the leading when line-height is disabled (both prop spellings)', () => {
    const modern = renderToStaticMarkup(<ButtonTextCompat lineHeightDisabled>X</ButtonTextCompat>)
    expect(modern).not.toContain('[line-height:20.7px]')
    const legacy = renderToStaticMarkup(<ButtonTextCompat line-height-disabled="true">X</ButtonTextCompat>)
    expect(legacy).not.toContain('[line-height:20.7px]')
    const on = renderToStaticMarkup(<ButtonTextCompat>X</ButtonTextCompat>)
    expect(on).toContain('[line-height:20.7px]')
  })
})

describe('ThemedIconCompat (web)', () => {
  it('sizes the glyph box per typeOfButton (label line-height vs $icon sizes)', () => {
    const button = renderToStaticMarkup(
      <ThemedIconCompat typeOfButton="button" size="medium">
        <svg />
      </ThemedIconCompat>,
    )
    // renderToStaticMarkup HTML-escapes `&` inside class attributes.
    expect(button).toContain('[&amp;_svg]:size-[20.7px]')
    const icon = renderToStaticMarkup(
      <ThemedIconCompat typeOfButton="icon" size="medium">
        <svg />
      </ThemedIconCompat>,
    )
    expect(icon).toContain('[&amp;_svg]:size-[24px]')
    expect(icon).not.toContain('[&amp;_svg]:size-[20.7px]')
  })

  it('renders nothing without a child', () => {
    expect(renderToStaticMarkup(<ThemedIconCompat typeOfButton="button" />)).toBe('')
  })
})

describe('IconButton / DropdownButton class tables', () => {
  it('icon-button size paddings override the frame size cell in the merge', () => {
    const markup = renderToStaticMarkup(<ButtonFrameCompat size="medium" className={ICON_BUTTON_SIZE_CLASSES.medium} />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('p-3')
    expect(classes).not.toContain('px-4')
    expect(classes).not.toContain('py-3')
  })

  it('tables only carry classes tailwind-merge can resolve against the frame cells', () => {
    // p-* must beat px-*/py-* — the cn contract the ui IconButton wrapper relies on.
    expect(cn('px-4 py-3', 'p-3')).toBe('p-3')
  })
})
