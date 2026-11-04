/**
 * WEB-leg behavior + emission pins for the IconButton compat.
 *
 * The closed frame surface (variant/emphasis cells, disabled cell, focus
 * ring) is ButtonCompat's, tested in `../button-compat/`; the `ICON_BUTTON_*` literal
 * tables are CSS-coverage-gated by
 * `../button-frame-compat/web-css-coverage.test.ts`. This suite pins what is
 * NEW here: the IconButtonFrame size variant riding the open lane (and losing
 * to caller props, the Tamagui variants-lose-to-props precedence), the
 * `typeOfButton: 'icon'` icon/spinner lane, the legacy orchestration defaults
 * (`fill={false}`, `equal:smaller-button` focus scaling), and the
 * OmitIncludingToLowercase prop-surface construction.
 */
import { fireEvent, render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { ICON_BUTTON_ICON_SIZE_PX, ICON_BUTTON_SIZE_CLASSES } from '../button-frame-compat/compile'
import type { ButtonSize } from '../button-frame-compat/compile'
import { IconButtonCompat } from './IconButtonCompat.web'
import type { IconButtonCompatProps } from './props'
import { ICON_BUTTON_FRAME_PADDING, ICON_BUTTON_FRAME_RADIUS } from './resolve'

const GLYPH = (
  <svg data-testid="glyph" viewBox="0 0 24 24">
    <path d="M0 0h24v24H0z" />
  </svg>
)

const frameClassesOf = (markup: string): string[] => {
  const match = /class="([^"]*)"/.exec(markup)
  return match?.[1]?.split(' ') ?? []
}

/*
 * The size variant's expected emission, as independent literals — deliberately
 * NOT derived from ICON_BUTTON_FRAME_PADDING/RADIUS or the class tables, so a
 * broken token in either can never re-derive its own expectation.
 */
const EXPECTED_SIZE_EMISSION: Record<ButtonSize, { padding: string; radius: string }> = {
  xxsmall: { padding: 'p-[6px]', radius: 'rounded-[12px]' },
  xsmall: { padding: 'p-[8px]', radius: 'rounded-[12px]' },
  small: { padding: 'p-[8px]', radius: 'rounded-[12px]' },
  medium: { padding: 'p-[12px]', radius: 'rounded-[16px]' },
  large: { padding: 'p-[16px]', radius: 'rounded-[20px]' },
}

/** Tailwind spacing/radius scale of the literal table's classes, as independent literals. */
const TABLE_CLASS_PX: Record<string, number> = {
  'p-1.5': 6,
  'p-2': 8,
  'p-3': 12,
  'p-4': 16,
  'rounded-12': 12,
  'rounded-16': 16,
  'rounded-20': 20,
}

const SIZES = Object.keys(EXPECTED_SIZE_EMISSION) as ButtonSize[]

describe('frame — legacy orchestration defaults', () => {
  it('renders an intrinsic-width button (fill=false), never the fill classes', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<IconButtonCompat icon={GLYPH} />))
    expect(classes).toContain('shrink-0')
    expect(classes).not.toContain('flex-1')
    expect(classes).not.toContain('self-stretch')
  })

  it('defaults focusScaling to equal:smaller-button (0.93/0.93), overridable like legacy', () => {
    const classes = frameClassesOf(renderToStaticMarkup(<IconButtonCompat icon={GLYPH} />))
    expect(classes).toContain('focus-visible:scale-x-[0.93]')
    expect(classes).toContain('focus-visible:scale-y-[0.93]')

    const overridden = frameClassesOf(renderToStaticMarkup(<IconButtonCompat icon={GLYPH} focusScaling="equal" />))
    expect(overridden).toContain('focus-visible:scale-x-[0.98]')
    expect(overridden).not.toContain('focus-visible:scale-x-[0.93]')
  })

  it('renders the variant/emphasis cell through the parity-proven closed surface', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(<IconButtonCompat icon={GLYPH} variant="critical" emphasis="primary" />),
    )
    expect(classes).toContain('bg-critical')
    expect(classes).toContain('hover:bg-critical-hovered')
  })
})

describe('frame — the IconButtonFrame size variant (uniform padding + per-size radius)', () => {
  it.each(SIZES)('%s: emits the size tokens and drops the button frame directional padding', (size) => {
    const classes = frameClassesOf(renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size={size} />))
    const expected = EXPECTED_SIZE_EMISSION[size]
    expect(classes).toContain(expected.padding)
    expect(classes).toContain(expected.radius)
    // tailwind-merge resolved the collision with the closed size cell: no
    // directional padding and no second radius survive.
    expect(classes.filter((cls) => /^px-|^py-/.test(cls))).toEqual([])
    expect(classes.filter((cls) => cls.startsWith('rounded'))).toEqual([expected.radius])
  })

  it.each(SIZES)('%s: the emission is px-identical to the ICON_BUTTON_SIZE_CLASSES literal table', (size) => {
    // The component rides the token lane while the literal table remains the
    // documented styled()-extension delta — this keeps the two from drifting.
    const [paddingClass, radiusClass] = ICON_BUTTON_SIZE_CLASSES[size].split(' ') as [string, string]
    const expected = EXPECTED_SIZE_EMISSION[size]
    expect(`p-[${TABLE_CLASS_PX[paddingClass]}px]`).toBe(expected.padding)
    expect(`rounded-[${TABLE_CLASS_PX[radiusClass]}px]`).toBe(expected.radius)
    // And the token tables themselves resolve to the same px.
    expect(ICON_BUTTON_FRAME_PADDING[size]).toBe(`$spacing${TABLE_CLASS_PX[paddingClass]}`)
    expect(ICON_BUTTON_FRAME_RADIUS[size]).toBe(`$rounded${TABLE_CLASS_PX[radiusClass]}`)
  })

  it('a caller p beats the size variant (props beat variants, the Tamagui precedence)', () => {
    // 3 is not a spacing token, so the engine emits its safelisted
    // var-indirection twin with the value on an inline custom property.
    const markup = renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size="xxsmall" p={3} />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('p-[var(--c-p)]')
    expect(markup).toContain('--c-p:3px')
    expect(classes).not.toContain('p-[6px]')
  })

  it('a caller padding LONGHAND also beats the size variant (legacy props-beat-variants, not the p-wins fixed order)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size="medium" padding="$spacing4" />),
    )
    expect(classes).toContain('p-[4px]')
    expect(classes).not.toContain('p-[12px]')
  })

  it('a caller borderRadius beats the size variant (the AuthenticatedHeader $rounded32 shape)', () => {
    const classes = frameClassesOf(
      renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size="small" borderRadius="$rounded32" />),
    )
    expect(classes).toContain('rounded-[32px]')
    expect(classes).not.toContain('rounded-[12px]')
  })

  it('an EXPLICIT p={undefined} keeps the size variant padding — legacy skips undefined props', () => {
    // The withhold guard sees undefined and emits the default; the default is
    // spread AFTER rest so rest's own explicit `p: undefined` key cannot
    // erase it (the legacy Tamagui undefined-prop-falls-back-to-variant rule).
    const classes = frameClassesOf(renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size="xxsmall" p={undefined} />))
    expect(classes).toContain('p-[6px]')
  })

  it('a caller px KEEPS the p default beside it — the per-axis merge, so only p/padding withhold the default', () => {
    // Tailwind's generated sheet orders the axis/side padding utilities after
    // the `p` shorthand (measured with the real compiler), so a caller's `px`
    // paints its axis over the default while the default keeps supplying the
    // y-axis — exactly legacy's per-property props-beat-variants merge, where
    // the variant `p` still pads the axes the caller didn't set. Withholding
    // the default on a directional prop would drop that remainder.
    const classes = frameClassesOf(
      renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size="xxsmall" px="$spacing8" />),
    )
    expect(classes).toContain('px-[8px]')
    expect(classes).toContain('p-[6px]')
  })

  it('a caller per-corner radius KEEPS the rounded default beside it — same per-corner merge as legacy', () => {
    // The long-tail corner class also sorts after `rounded-*` in the generated
    // sheet, so the caller's corner wins at paint time while the default keeps
    // the other three corners.
    const markup = renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size="small" borderTopLeftRadius="$rounded32" />)
    const classes = frameClassesOf(markup)
    expect(classes).toContain('[border-top-left-radius:var(--c-btlr)]')
    expect(markup).toContain('--c-btlr:32px')
    expect(classes).toContain('rounded-[12px]')
  })

  it('open-lane consumer props ride through: hoverStyle, cursor, scale (the real 16-consumer surface)', () => {
    const markup = renderToStaticMarkup(
      <IconButtonCompat
        icon={GLYPH}
        emphasis="text-only"
        hoverStyle={{ backgroundColor: '$surface2' }}
        cursor="pointer"
        scale={0.8}
      />,
    )
    const classes = frameClassesOf(markup)
    // hoverStyle backgrounds and non-token transforms ride the engine's
    // var-indirection twins; cursor:pointer is an in-set arbitrary property.
    expect(classes).toContain('hover:bg-[color:var(--ch-bg)]')
    expect(markup).toContain('--ch-bg:var(--surface2)')
    expect(classes).toContain('[cursor:pointer]')
    expect(classes).toContain('[transform:var(--c-tr)]')
    expect(markup).toContain('--c-tr:scale(0.8)')
  })
})

describe('icon slot — the typeOfButton: "icon" lane', () => {
  it.each(SIZES)('%s: the glyph box is the $icon size, overriding the button label lane', (size) => {
    // renderToStaticMarkup HTML-escapes the `&` in the descendant selector.
    const markup = renderToStaticMarkup(<IconButtonCompat icon={GLYPH} size={size} />)
    expect(markup).toContain(`_svg]:size-[${ICON_BUTTON_ICON_SIZE_PX[size]}px]`)
    // tailwind-merge resolved the collision with the button label lane's box.
    expect(markup).not.toContain('size-[20.7px]')
    expect(markup).not.toContain('size-[16.1px]')
    expect(markup).not.toContain('size-[13.8px]')
  })

  it('renders the glyph inside the themed icon wrapper', () => {
    const { getByTestId } = render(<IconButtonCompat icon={GLYPH} />)
    expect(getByTestId('glyph').closest('span')).not.toBeNull()
  })
})

describe('loading', () => {
  it('swaps the glyph for the spinner, sized by the $icon lane', () => {
    const markup = renderToStaticMarkup(<IconButtonCompat icon={GLYPH} loading size="medium" />)
    expect(markup).toContain('sbtn-spin')
    expect(markup).toContain('width:24px;height:24px')
    expect(markup).not.toContain('data-testid="glyph"')
  })

  it('applies the disabled UI while loading', () => {
    const markup = renderToStaticMarkup(<IconButtonCompat icon={GLYPH} loading />)
    expect(frameClassesOf(markup)).toContain('bg-surface2')
    expect(markup).toContain('disabled=""')
  })

  it('UNMOUNTS the icon slot while loading — the spinner is the only content box, so the frame stays single-width', () => {
    // ThemedIconCompat's no-children null return mirrors legacy ThemedIcon's
    // own guard: while loading the frame holds exactly one content wrapper
    // (the spinner), never an empty icon box beside it that would widen the
    // button beyond legacy.
    const markup = renderToStaticMarkup(<IconButtonCompat icon={GLYPH} loading size="medium" />)
    expect(markup.match(/<span/g)).toHaveLength(1)
  })
})

describe('interaction + passthrough', () => {
  it('dispatches onPress on click', () => {
    const onPress = vi.fn()
    const { getByRole } = render(<IconButtonCompat icon={GLYPH} onPress={onPress} />)
    fireEvent.click(getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('disabled blocks dispatch and renders the disabled cell', () => {
    const onPress = vi.fn()
    const { getByRole } = render(<IconButtonCompat icon={GLYPH} disabled onPress={onPress} />)
    const button = getByRole('button')
    expect(button.hasAttribute('disabled')).toBe(true)
    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('disabled + onDisabledPress stays interactive and dispatches onPress, never onDisabledPress (legacy IconButton parity)', () => {
    // The onPress→onDisabledPress swap lives in legacy Button.tsx ONLY;
    // legacy IconButton.tsx spreads props into the styled frame, where
    // onDisabledPress is styling-only (the isDisabled variant returns {} so
    // the button keeps dispatching its regular onPress).
    const onPress = vi.fn()
    const onDisabledPress = vi.fn()
    const { getByRole } = render(
      <IconButtonCompat icon={GLYPH} disabled onPress={onPress} onDisabledPress={onDisabledPress} />,
    )
    const button = getByRole('button')
    expect(button.hasAttribute('disabled')).toBe(false)
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onDisabledPress).not.toHaveBeenCalled()
  })

  it('forwards testID as data-testid and raw data-* verbatim', () => {
    const markup = renderToStaticMarkup(<IconButtonCompat icon={GLYPH} testID="wallet-settings" data-thing="x" />)
    expect(markup).toContain('data-testid="wallet-settings"')
    expect(markup).toContain('data-thing="x"')
  })
})

describe('prop surface — the legacy OmitIncludingToLowercase construction', () => {
  it('keeps the legacy-kept keys and drops every flex/icon/size/height/width-named key', () => {
    // Kept (spot checks across the surviving families).
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('icon')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('size')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('loading')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('disabled')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('onDisabledPress')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('fill')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('p')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('padding')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('borderRadius')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('hoverStyle')
    expectTypeOf<IconButtonCompatProps>().toHaveProperty('shouldAnimateBetweenLoadingStates')

    // Dropped by the operator, exactly as on legacy.
    type Dropped = Extract<
      keyof IconButtonCompatProps,
      | 'width'
      | 'height'
      | 'minWidth'
      | 'minHeight'
      | 'maxWidth'
      | 'maxHeight'
      | 'iconPosition'
      | 'flex'
      | 'flexBasis'
      | 'flexGrow'
      | 'borderWidth'
    >
    expectTypeOf<Dropped>().toEqualTypeOf<never>()
  })

  it('icon is required', () => {
    // @ts-expect-error — icon is the one required prop, as on legacy.
    expectTypeOf<IconButtonCompatProps>().toEqualTypeOf<Omit<IconButtonCompatProps, 'icon'>>()
    expectTypeOf<IconButtonCompatProps['icon']>().not.toEqualTypeOf<undefined>()
  })
})
