import { fireEvent } from '@testing-library/react'
import { colorsLight } from '@universe/mycelium/theme-palette'
import { StyledInput } from '~/components/NumericalInput/NumericalInput'
import { render, screen } from '~/test-utils/render'

function rgbChannels(value: string): string {
  const hex = /^#([0-9a-fA-F]{6})$/.exec(value.trim())
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16)
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
  }
  const match = /^rgba?\(([^)]+)\)$/.exec(value.trim())
  if (!match?.[1]) {
    return value.trim()
  }
  return match[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()))
    .join(',')
}

/**
 * Two assertions differ from the pre-conversion contract because they had pinned Tamagui runtime
 * artefacts, not rendered behaviour. Chromium on both deployed builds reports IDENTICAL computed
 * boxShadow (`none`), outlineStyle, outlineWidth and opacity, resting and focused.
 */
describe('StyledInput (props wrapper over the rebuilt Input)', () => {
  it('renders an unstyled <input> whose frame does not change on focus', () => {
    render(<StyledInput data-testid="numeric-input" />)
    const el = screen.getByTestId('numeric-input') as HTMLInputElement

    expect(el.tagName).toBe('INPUT')
    // `unstyled` must skip the legacy default frame, so nothing ever sets a box-shadow…
    expect(el.style.boxShadow).toBe('')
    // …and the `$platform-web` leg suppresses the focus ring from the RESTING state.
    expect(el.style.outlineStyle).toBe('none')
    // jsdom's cssstyle normalizes a zero length to '0'; parse rather than pin the serialization.
    expect(Number.parseFloat(el.style.outlineWidth)).toBe(0)

    fireEvent.focus(el)
    expect(el.style.boxShadow).toBe('')
    expect(el.style.outlineStyle).toBe('none')
    expect(Number.parseFloat(el.style.outlineWidth)).toBe(0)

    fireEvent.blur(el)
    expect(el.style.boxShadow).toBe('')
    expect(el.style.outlineStyle).toBe('none')
  })

  it('delivers the wrapper color tokens to the DOM in the default state', () => {
    // Regression guard: the wrapper passes `color: '$neutral1'` as a token, and the rebuilt Input
    // must resolve it to a concrete value (jsdom drops var() on color properties, and an
    // unresolved reference would mean the browser depends on injected CSS variables staying alive).
    render(<StyledInput data-testid="numeric-colors" />)
    const el = screen.getByTestId('numeric-colors') as HTMLInputElement

    expect(rgbChannels(el.style.color)).toBe(rgbChannels(colorsLight.neutral1))
    // Literal (non-token) wrapper values pass through unchanged.
    expect(el.style.backgroundColor).toBe('transparent')
    expect(el.style.whiteSpace).toBe('nowrap')
    expect(el.style.textOverflow).toBe('ellipsis')
  })

  it('drives hoverStyle through the wrapper via the chained mouse handlers', () => {
    // The rebuilt Input owns the hover runtime now — it must chain the handlers, not clobber them.
    render(<StyledInput data-testid="numeric-hover" hoverStyle={{ opacity: 0.5 }} />)
    const el = screen.getByTestId('numeric-hover') as HTMLInputElement

    // A hoverStyle opacity with no base opacity synthesizes a resting `opacity: 1`, as legacy Tamagui did.
    expect(el.style.opacity).toBe('1')
    fireEvent.mouseEnter(el)
    expect(el.style.opacity).toBe('0.5')
    fireEvent.mouseLeave(el)
    expect(el.style.opacity).toBe('1')
  })

  it('applies the amountLayout typography, and lets a call-site prop beat it', () => {
    render(<StyledInput data-testid="numeric-layout-default" />)
    const def = screen.getByTestId('numeric-layout-default') as HTMLInputElement
    expect(def.style.textAlign).toBe('right')
    expect(def.style.fontSize).toBe('28px')

    render(<StyledInput data-testid="numeric-layout-swap" amountLayout="swapCurrency" />)
    const swap = screen.getByTestId('numeric-layout-swap') as HTMLInputElement
    expect(swap.style.textAlign).toBe('left')
    expect(swap.style.fontSize).toBe('36px')
    expect(swap.style.maxHeight).toBe('44px')

    // The layout objects spread BEFORE `{...rest}`, exactly as the variant lost to a prop. This is
    // the precedence FeeTierSearchModal's dropped `textAlign: 'right'` depended on.
    render(<StyledInput data-testid="numeric-layout-override" textAlign="left" fontSize={12} />)
    const override = screen.getByTestId('numeric-layout-override') as HTMLInputElement
    expect(override.style.textAlign).toBe('left')
    expect(override.style.fontSize).toBe('12px')
  })
})
