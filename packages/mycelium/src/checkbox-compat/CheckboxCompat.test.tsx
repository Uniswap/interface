/**
 * Behavior contract for the `CheckboxCompat` web leg (INFRA-3233), asserted on
 * the rendered DOM so `cn()`'s merge result is what gets checked.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
// Type-only — react-native runtime imports are banned outside .native legs.
import type { ViewStyle } from 'react-native'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetWebStyleWarnings } from '../compat/web-diagnostics'
import { CheckboxCompat } from './CheckboxCompat'
import type { CheckboxCompatSizeToken } from './props'

afterEach(cleanup)

const SIZE_TOKENS: CheckboxCompatSizeToken[] = ['$icon.16', '$icon.18', '$icon.20']

function box(): HTMLElement {
  return screen.getByRole('checkbox')
}

/** The outer focus-ring frame wrapping the control. */
function ring(): HTMLElement {
  const parent = box().parentElement
  if (parent === null) {
    throw new Error('focus ring frame not rendered')
  }
  return parent
}

describe('host element and a11y', () => {
  it('renders a real focusable control, not a div (the INFRA-3140 failure mode)', () => {
    render(<CheckboxCompat checked={false} />)
    expect(box().tagName).toBe('BUTTON')
    expect(box().getAttribute('type')).toBe('button')
    expect(box().getAttribute('role')).toBe('checkbox')
  })

  it('reflects checked state through aria-checked', () => {
    const { rerender } = render(<CheckboxCompat checked={false} />)
    expect(box().getAttribute('aria-checked')).toBe('false')
    rerender(<CheckboxCompat checked />)
    expect(box().getAttribute('aria-checked')).toBe('true')
  })

  it('marks disabled on both the DOM attribute and aria', () => {
    render(<CheckboxCompat checked={false} disabled />)
    expect((box() as HTMLButtonElement).disabled).toBe(true)
    expect(box().getAttribute('aria-disabled')).toBe('true')
  })
})

/**
 * The four props that reach legacy only through the
 * `Omit<TamaguiCheckboxProps, 'size'>` spread. Legacy honours `id` on both
 * platforms and `name`/`value`/`required` on web only, so the native leg's
 * absence of the three is parity, not a gap (see `CheckboxCompatProps`).
 *
 * Every assertion here pins PRESENCE before absence: `expect(attr).toBeNull()`
 * on a component that never emitted the attribute in the first place passes
 * vacuously and guards nothing.
 */
describe('form/focus props from the Tamagui spread', () => {
  it('id reaches the control (legacy honours it on BOTH legs) and is absent when unset', () => {
    const withId = render(<CheckboxCompat checked={false} id="terms-box" />)
    expect(box().getAttribute('id')).toBe('terms-box')
    withId.unmount()
    render(<CheckboxCompat checked={false} />)
    expect(box().hasAttribute('id')).toBe(false)
  })

  it('name reaches the control on web and is absent when unset', () => {
    const withName = render(<CheckboxCompat checked={false} name="acknowledged" />)
    expect(box().getAttribute('name')).toBe('acknowledged')
    withName.unmount()
    render(<CheckboxCompat checked={false} />)
    expect(box().hasAttribute('name')).toBe(false)
  })

  it('value reaches the control on web, and no "on" default is invented when unset', () => {
    const withValue = render(<CheckboxCompat checked={false} value="yes" />)
    expect(box().getAttribute('value')).toBe('yes')
    withValue.unmount()
    // Legacy DOES default `value` to the string "on" and so
    // emits `value="on"` on every checkbox. The compat deliberately does not:
    // the attribute is inert on `<button type="button">` and no call site reads
    // it. A deliberate deviation, not a drift.
    render(<CheckboxCompat checked={false} />)
    expect(box().hasAttribute('value')).toBe(false)
  })

  it('maps the legacy `required` prop onto aria-required (not a <button> attribute) and omits it when unset', () => {
    const withRequired = render(<CheckboxCompat checked={false} required />)
    expect(box().getAttribute('aria-required')).toBe('true')
    expect(box().hasAttribute('required')).toBe(false)
    withRequired.unmount()
    render(<CheckboxCompat checked={false} />)
    expect(box().hasAttribute('aria-required')).toBe(false)
  })
})

describe('testID passthrough', () => {
  it('renders testID as data-testid (RemovePasskeyModal.tsx:293 passes one)', () => {
    render(<CheckboxCompat checked={false} testID="dont-show-again" />)
    expect(screen.getByTestId('dont-show-again')).toBe(box())
  })

  it('omits data-testid entirely when testID is absent', () => {
    render(<CheckboxCompat checked={false} />)
    expect(box().hasAttribute('data-testid')).toBe(false)
  })
})

describe('size tokens each render their own size (INFRA-3233)', () => {
  it.each(SIZE_TOKENS)('%s renders distinct ring/box classes', (size) => {
    render(<CheckboxCompat checked size={size} />)
    const px = Number(size.replace('$icon.', ''))
    expect(box().className).toContain(`h-[${px}px]`)
    expect(box().className).toContain(`w-[${px}px]`)
  })

  it('no two tokens produce the same box class (nothing collapses onto 20px)', () => {
    const rendered = SIZE_TOKENS.map((size) => {
      const view = render(<CheckboxCompat checked={false} size={size} />)
      const className = box().className
      view.unmount()
      return className
    })
    expect(new Set(rendered).size).toBe(3)
  })

  it('defaults to the $icon.20 geometry when size is omitted', () => {
    render(<CheckboxCompat checked={false} />)
    expect(box().className).toContain('h-[20px]')
    expect(ring().className).toContain('h-[26px]')
  })
})

describe('press wiring', () => {
  it('dispatches onPress and onCheckedChange with the NEXT state', () => {
    const onPress = vi.fn()
    const onCheckedChange = vi.fn()
    render(<CheckboxCompat checked={false} onCheckedChange={onCheckedChange} onPress={onPress} />)
    fireEvent.click(box())
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('onCheckedChange receives the negation of the current state, not the current state', () => {
    const onCheckedChange = vi.fn()
    render(<CheckboxCompat checked onCheckedChange={onCheckedChange} />)
    fireEvent.click(box())
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it('accepts a nullary handler, like every real call site (`onPress={toggleDoNotShowAgain}`)', () => {
    const toggle = vi.fn()
    render(<CheckboxCompat checked={false} onPress={toggle} />)
    fireEvent.click(box())
    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('disabled detaches the press surface', () => {
    const onPress = vi.fn()
    render(<CheckboxCompat checked={false} disabled onPress={onPress} />)
    fireEvent.click(box())
    expect(onPress).not.toHaveBeenCalled()
    expect(box().className).toContain('pointer-events-none')
  })
})

describe('indicator and hover dot', () => {
  it('renders the checkmark indicator only when checked', () => {
    const { rerender } = render(<CheckboxCompat checked={false} />)
    expect(box().querySelector('svg')).toBeNull()
    rerender(<CheckboxCompat checked />)
    expect(box().querySelector('svg')).not.toBeNull()
  })

  it('the checkmark is mycelium own Check icon geometry (legacy glyph, byte-identical paths)', () => {
    render(<CheckboxCompat checked />)
    const svg = box().querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('0 0 48 48')
    expect(svg?.querySelectorAll('line').length).toBe(2)
  })

  it('shows the $neutral2 hover dot only while unchecked and hovered', () => {
    render(<CheckboxCompat checked={false} />)
    const dotSelector = '.bg-neutral2'
    expect(box().querySelector(dotSelector)).toBeNull()
    fireEvent.mouseEnter(box())
    expect(box().querySelector(dotSelector)).not.toBeNull()
    fireEvent.mouseLeave(box())
    expect(box().querySelector(dotSelector)).toBeNull()
  })

  it('never shows the hover dot when checked or disabled', () => {
    const { rerender } = render(<CheckboxCompat checked />)
    fireEvent.mouseEnter(box())
    expect(box().querySelector('.bg-neutral2')).toBeNull()
    rerender(<CheckboxCompat checked={false} disabled />)
    fireEvent.mouseEnter(box())
    expect(box().querySelector('.bg-neutral2')).toBeNull()
  })
})

describe('hover and focus are React state, never a hover:/focus-visible: variant', () => {
  it('hovering swaps the checked border to the hovered accent (no hover: class is emitted)', () => {
    render(<CheckboxCompat checked />)
    expect(box().className).toContain('border-neutral1')
    expect(box().className).not.toMatch(/hover:/)
    fireEvent.mouseEnter(box())
    expect(box().className).toContain('border-neutral1-hovered')
  })

  it('focusing paints the ring; blurring returns it to transparent', () => {
    render(<CheckboxCompat checked={false} />)
    expect(ring().className).toContain('border-transparent')
    fireEvent.focus(box())
    expect(ring().className).toContain('border-neutral3')
    fireEvent.blur(box())
    expect(ring().className).toContain('border-transparent')
  })

  it('branded + selected + focused paints the ring with the accent (getFocusedRingColor:163)', () => {
    render(<CheckboxCompat checked variant="branded" />)
    fireEvent.focus(box())
    expect(ring().className).toContain('border-accent1')
  })
})

describe('variant maps to the LEGACY union, not the unrelated mycelium Checkbox union', () => {
  it("branded fills with accent1 and 'default' with the neutral1 accent3 alias", () => {
    const branded = render(<CheckboxCompat checked variant="branded" />)
    expect(box().querySelector('.bg-accent1')).not.toBeNull()
    branded.unmount()
    render(<CheckboxCompat checked variant="default" />)
    expect(box().querySelector('.bg-neutral1')).not.toBeNull()
  })
})

describe('accepted-and-ignored props (legacy re-declares them after {...rest})', () => {
  it('borderColor is a no-op — identical markup with and without it', () => {
    const without = render(<CheckboxCompat checked />)
    const baseline = box().className
    without.unmount()
    render(<CheckboxCompat checked borderColor="$accent1" />)
    expect(box().className).toBe(baseline)
    expect(box().className).not.toContain('border-accent1')
    expect(box().getAttribute('style')).toBeNull()
  })

  it('pointerEvents is a no-op — the value is always derived from disabled', () => {
    const enabled = render(<CheckboxCompat checked={false} pointerEvents="none" />)
    expect(box().className).not.toMatch(/pointer-events-/)
    enabled.unmount()
    render(<CheckboxCompat checked={false} disabled pointerEvents="auto" />)
    expect(box().className).toContain('pointer-events-none')
  })
})

describe('escape hatches', () => {
  it('className merges last so the caller wins', () => {
    render(<CheckboxCompat checked={false} className="rounded-12" />)
    expect(box().className).toContain('rounded-12')
    expect(box().className).not.toContain('rounded-4')
  })

  it('style passes through to the control', () => {
    render(<CheckboxCompat checked={false} style={{ opacity: 0.5 }} />)
    expect(box().style.opacity).toBe('0.5')
  })
})

describe('check glyph colour: the inline-style lane', () => {
  /**
   * The glyph colour reaches the DOM as inline style, and both gates covering
   * this component are blind to that lane BY CONSTRUCTION: the native emission
   * gate enumerates classNames, and an inline style has none; the web parity
   * comparison is scoped to the focus-ring frame, two levels above the glyph.
   *
   * The hazard here is NOT an unresolved `$` string reaching the SVG —
   * `createIcon` resolves `$` tokens itself, to the auto-switching
   * `var(--<token>)` custom properties `@universe/tailwind` emits at `:root`
   * and `.dark` (createIcon.tsx:52-63, css/variables.css:48,60,160,172). The
   * hazard is that mycelium's icon colour set is much NARROWER than the
   * legacy Spore set, and `createIcon` THROWS on a token outside it
   * (createIcon.tsx:62). So retargeting the glyph at any token mycelium does
   * not carry turns a checkbox render into an exception — which is what these
   * assertions catch.
   *
   * jsdom caveat, and the trap to avoid: jsdom's CSSOM silently DISCARDS any
   * `var()` value, so `element.style.color` reads back empty for the two
   * token-valued cases even though the emitted CSS is valid and correct in a
   * browser. Absence of a colour here is therefore NOT evidence of a bug, and
   * an assertion of the form `expect(style.color).toBe(…)` would be asserting
   * a jsdom artifact. Only the literal (`branded`) case is observable, and it
   * is asserted as such below.
   */
  const GLYPH_STATES = [
    { variant: 'default', disabled: false },
    { variant: 'default', disabled: true },
    { variant: 'branded', disabled: false },
    { variant: 'branded', disabled: true },
  ] as const

  it.each(GLYPH_STATES)('renders the checked glyph for variant=$variant disabled=$disabled', (state) => {
    // A colour token outside mycelium's set throws out of createIcon, so
    // rendering at all is the assertion: every glyph colour the component can
    // produce must be one mycelium can resolve.
    expect(() => render(<CheckboxCompat checked disabled={state.disabled} variant={state.variant} />)).not.toThrow()
    expect(document.querySelector('svg')).not.toBeNull()
  })

  it('paints the branded glyph the literal colour legacy paints', () => {
    render(<CheckboxCompat checked variant="branded" />)
    const glyph = document.querySelector('svg')
    // `white` is a literal, not a token, so jsdom keeps it — this is the one
    // cell of the matrix where the resolved colour is observable here.
    expect(glyph?.style.color).toBe('white')
  })

  it('does not leak a raw `$` token into the DOM for the default variant', () => {
    render(<CheckboxCompat checked variant="default" />)
    const glyph = document.querySelector('svg')
    expect(glyph).not.toBeNull()
    // Pin the lane before reading it. "Resolved" and "the inline-style channel
    // was dropped entirely" both read as token-free, so a bare no-`$` check on
    // a missing attribute passes vacuously — and a dropped style channel is
    // exactly the class of regression this block exists to catch. The
    // attribute is always there in jsdom: createIcon rides width/height on
    // inline style too (createIcon.tsx:127-131), so only the `var()` colour is
    // discarded, never the attribute.
    const inlineStyle = glyph?.getAttribute('style')
    expect(inlineStyle, 'the glyph emits no inline style at all — the lane this block guards is gone').toBeTypeOf(
      'string',
    )
    // The token must be RESOLVED, never passed through. A regression that
    // bypassed createIcon's resolution would show up as a literal `$surface1`
    // in the style attribute (jsdom keeps unknown-but-parseable idents out,
    // but the attribute text is checked directly so nothing can hide).
    expect(inlineStyle).not.toContain('$')
  })
})

/**
 * `style` is the array-admitting `StyleProp<ViewStyle | React.CSSProperties>`.
 * An array handed straight to React DOM is dropped SILENTLY — it iterates the
 * keys `0`/`1`, finds no CSS property by those names and emits no style
 * attribute at all — while RN flattens the same value, so only
 * `flattenStyleProp` keeps the two legs agreeing.
 *
 * Every case below pins the attribute's PRESENCE before reading its content:
 * when the array is dropped there is no attribute, and every
 * `style.foo === ''` read then passes vacuously against nothing.
 */
describe('style is flattened, not cast', () => {
  function inlineStyle(): string | null {
    return box().getAttribute('style')
  }

  it('emits no style attribute at all when style is absent (the vacuous-pass baseline)', () => {
    render(<CheckboxCompat checked={false} />)
    expect(inlineStyle()).toBeNull()
  })

  it('applies a plain-object style', () => {
    render(<CheckboxCompat checked={false} style={{ opacity: 0.5 }} />)
    expect(inlineStyle(), 'the control emits no inline style at all').toBeTypeOf('string')
    expect(box().style.opacity).toBe('0.5')
  })

  it('flattens an ARRAY style instead of dropping it', () => {
    render(<CheckboxCompat checked={false} style={[{ flex: 1 }, { opacity: 0.5 }]} />)
    expect(inlineStyle(), 'the control emits no inline style at all — the array style was dropped').toBeTypeOf('string')
    expect(box().style.flex).toBe('1')
    expect(box().style.opacity).toBe('0.5')
  })

  it('applies array entries left-to-right, later entries winning', () => {
    render(<CheckboxCompat checked={false} style={[{ opacity: 0.2 }, { opacity: 0.9 }]} />)
    expect(inlineStyle(), 'the control emits no inline style at all — the array style was dropped').toBeTypeOf('string')
    expect(box().style.opacity).toBe('0.9')
  })

  it('skips falsy array entries, exactly as StyleSheet.flatten does', () => {
    render(<CheckboxCompat checked={false} style={[false, null, { flex: 1 }, undefined]} />)
    expect(inlineStyle(), 'the control emits no inline style at all — the array style was dropped').toBeTypeOf('string')
    expect(box().style.flex).toBe('1')
  })

  it('flattens NESTED arrays', () => {
    render(<CheckboxCompat checked={false} style={[[{ flex: 1 }], [[{ opacity: 0.5 }]]]} />)
    expect(inlineStyle(), 'the control emits no inline style at all — the array style was dropped').toBeTypeOf('string')
    expect(box().style.flex).toBe('1')
    expect(box().style.opacity).toBe('0.5')
  })
})

/**
 * This leg flattens through the pair's own `flattenStyleProp`, NOT
 * `mergeCompatStyle`, so it does not inherit the RN-only-key dev warning the
 * canonical merge carries — the web leg wires `warnUnsupportedWebStyleKeys`
 * explicitly, and this block is what keeps it wired (INFRA-3509 review run 3).
 */
describe('RN-only style keys dev-warn on the web leg', () => {
  beforeEach(() => {
    __resetWebStyleWarnings()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns when a RegisteredStyle id is dropped from the style prop (wired next to the RN-only-key warning)', () => {
    render(<CheckboxCompat checked={false} style={[7 as unknown as ViewStyle, { flex: 1 }]} />)
    const warned = vi
      .mocked(console.warn)
      .mock.calls.map((call) => String(call[0]))
      .join('\n')
    expect(warned).toContain('RegisteredStyle id (7)')
  })

  it('warns for an RN-only key that CSS cannot render (the review-cited repro)', () => {
    render(<CheckboxCompat checked={false} style={{ elevation: 4 }} />)
    const warned = vi
      .mocked(console.warn)
      .mock.calls.map((call) => String(call[0]))
      .join('\n')
    expect(warned).toContain('"elevation"')
  })

  it('warns through a flattened ARRAY style too', () => {
    render(<CheckboxCompat checked={false} style={[{ flex: 1 }, { marginHorizontal: 8 }]} />)
    const warned = vi
      .mocked(console.warn)
      .mock.calls.map((call) => String(call[0]))
      .join('\n')
    expect(warned).toContain('"marginHorizontal"')
  })

  it('stays silent for plain CSS keys', () => {
    render(<CheckboxCompat checked={false} style={{ opacity: 0.5 }} />)
    expect(console.warn).not.toHaveBeenCalled()
  })
})
