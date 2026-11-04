import { fireEvent } from '@testing-library/react'
import { colorsLight } from '@universe/mycelium/theme-palette'
import { SearchInput } from '~/components/SearchModal/styled'
import { render, screen } from '~/test-utils/render'

function normalizedColor(value: string): string {
  const trimmed = value.trim()
  const hex = /^#([0-9a-fA-F]{6})$/.exec(trimmed)
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16)
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
  }
  const match = /^rgba?\(([^)]+)\)$/.exec(trimmed)
  if (!match || !match[1]) {
    return trimmed
  }
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()))
  return parts.slice(0, 3).join(',')
}

/**
 * Contract tests for the riskiest unknown of the Input rebuild: a REAL Tamagui
 * `styled(Input, ...)` wrapper (this one, from the live SearchModal) must still deliver its
 * config through the styled() boundary into the rebuilt, Tamagui-free component. Captured
 * delivery shape: pass-through props (placeholderTextColor, fontSize, whiteSpace) plus a
 * `style` object whose token values arrive as var(--t-*) references; pseudo styles
 * (focusStyle) are driven by Tamagui's own runtime handlers, covered by the sibling
 * StyledInput (NumericalInput) test where the values are jsdom-observable.
 */
describe('SearchInput (styled(Input) wrapper) over the rebuilt Input', () => {
  it('renders a raw <input> with the wrapper config delivered through the styled() boundary', () => {
    render(<SearchInput data-testid="search-input" placeholder="Search tokens" />)
    const el = screen.getByTestId('search-input') as HTMLInputElement

    expect(el.tagName).toBe('INPUT')
    expect(el.placeholder).toBe('Search tokens')
    // placeholderTextColor from the wrapper config arrives as a prop and is resolved
    // by the rebuilt Input into its CSS-var pseudo-rule delivery.
    expect(el.hasAttribute('data-uds-placeholder')).toBe(true)
    expect(normalizedColor(el.style.getPropertyValue('--uds-input-placeholder'))).toBe(
      normalizedColor(colorsLight.neutral3),
    )
    // Concrete (non-token) config values survive the style-object delivery verbatim.
    expect(el.style.fontWeight).toBe('500')
    expect(el.style.whiteSpace).toBe('nowrap')
  })

  it('delivers the wrapper-config THEME color tokens to the DOM in the default state', () => {
    // Regression: Tamagui delivers theme tokens as var(--<themeKey>) references inside the
    // merged style object (backgroundColor: 'var(--surface2)', borderTopColor:
    // 'var(--surface3)', color: 'var(--neutral1)'); the rebuilt Input must resolve them to
    // concrete theme values — jsdom's cssstyle silently DROPS var() on color properties, so
    // an unresolved reference reads back as an empty style here (and shipped that way once).
    render(<SearchInput data-testid="search-colors" />)
    const el = screen.getByTestId('search-colors') as HTMLInputElement

    expect(normalizedColor(el.style.backgroundColor)).toBe(normalizedColor(colorsLight.surface2))
    expect(normalizedColor(el.style.color)).toBe(normalizedColor(colorsLight.neutral1))
    expect(normalizedColor(el.style.borderTopColor)).toBe(normalizedColor(colorsLight.surface3))
    // surface3 carries alpha — make sure it survives too, not just the RGB channels.
    expect(el.style.borderTopColor).toMatch(/rgba?\(/)
    expect(el.style.borderTopColor.replace(/\s/g, '')).toContain('0.08')
  })

  it('keeps a consumer-passed inline style winning over wrapper config, focused or not (legacy parity)', () => {
    // Legacy: wrapper config compiled to classes, a consumer style prop was inline and beat
    // them — Tamagui still merges the consumer style last when wrapping the plain Input.
    render(<SearchInput data-testid="search-style" style={{ borderColor: colorsLight.statusCritical }} />)
    const el = screen.getByTestId('search-style') as HTMLInputElement

    expect(normalizedColor(el.style.borderColor)).toBe(normalizedColor(colorsLight.statusCritical))
    fireEvent.focus(el)
    expect(normalizedColor(el.style.borderColor)).toBe(normalizedColor(colorsLight.statusCritical))
    fireEvent.blur(el)
    expect(normalizedColor(el.style.borderColor)).toBe(normalizedColor(colorsLight.statusCritical))
  })

  it('propagates typing through the wrapper (controlled onChangeText path)', () => {
    const onChangeText = vi.fn()
    render(<SearchInput data-testid="search-typing" value="" onChangeText={onChangeText} />)

    fireEvent.change(screen.getByTestId('search-typing'), { target: { value: 'UNI' } })
    expect(onChangeText).toHaveBeenCalledWith('UNI')
  })
})
