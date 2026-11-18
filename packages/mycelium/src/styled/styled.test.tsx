// @vitest-environment jsdom
import { act, fireEvent, render } from '@testing-library/react'
import { type CSSProperties, forwardRef } from 'react'
import { describe, expect, it } from 'vitest'
import { collectStyledClasses, validateStyledClasses } from './classes'
import { markHoverable, styled } from './styled'
import type { GetProps } from './types'

const Frame = styled('div', {
  base: 'rounded-12 bg-transparent',
  variants: {
    centered: { true: 'items-center justify-center', false: '' },
    row: { true: 'flex-row', false: 'flex-col' },
    disabled: { true: 'opacity-60', false: '' },
    hoverable: { true: '', false: '' },
    variant: {
      none: '',
      outlined: 'border border-surface3',
      filled: 'bg-surface3',
      raised: 'border border-surface3',
    },
  },
  compoundVariants: [{ variant: 'raised', disabled: true, class: 'bg-surface2' }],
  defaultVariants: { variant: 'none', centered: false, hoverable: true, row: false },
  // `disabled` is a behavioural DOM attribute: on a DOM base the validator
  // requires forwarding it so the element keeps the real attribute.
  forwardProps: ['disabled'],
  hover: [{ hoverable: true, disabled: false, class: 'bg-surface3-hovered' }],
  inlineStyle: ({ variant, disabled }) =>
    variant === 'raised' && disabled !== true ? { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : undefined,
})

function classesOf(container: HTMLElement): string[] {
  return (container.firstElementChild?.className ?? '').split(/\s+/).filter(Boolean)
}

describe('styled() class-select lane', () => {
  it('renders base + defaulted variant classes', () => {
    const { container } = render(<Frame />)
    expect(classesOf(container).sort()).toEqual(['bg-transparent', 'flex-col', 'rounded-12'])
  })

  it('selects enumerated and boolean variant branches', () => {
    const { container } = render(<Frame variant="outlined" row centered />)
    const classes = classesOf(container)
    expect(classes).toContain('border')
    expect(classes).toContain('border-surface3')
    expect(classes).toContain('flex-row')
    expect(classes).toContain('items-center')
    expect(classes).not.toContain('flex-col')
  })

  it('applies compound variants', () => {
    const { container } = render(<Frame variant="raised" disabled />)
    const classes = classesOf(container)
    expect(classes).toContain('bg-surface2')
    expect(classes).toContain('opacity-60')
  })

  it('merges the caller className last (tailwind-merge conflict resolution)', () => {
    const { container } = render(<Frame variant="filled" className="bg-surface5" />)
    const classes = classesOf(container)
    expect(classes).toContain('bg-surface5')
    expect(classes).not.toContain('bg-surface3')
  })

  it('consumes variant props instead of forwarding them to the base', () => {
    const { container } = render(<Frame variant="filled" centered />)
    const host = container.firstElementChild as HTMLElement
    expect(host.getAttribute('variant')).toBeNull()
    expect(host.getAttribute('centered')).toBeNull()
  })

  it('forwards declared forwardProps variant keys to the base', () => {
    const Button = styled('button', {
      variants: { disabled: { true: 'opacity-60', false: '' } },
      forwardProps: ['disabled'],
    })
    const { container } = render(<Button disabled />)
    expect((container.firstElementChild as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('styled() inline-style lane', () => {
  it('resolves config inline style and keeps the caller style on top', () => {
    const { container } = render(<Frame variant="raised" style={{ width: 42 }} />)
    const host = container.firstElementChild as HTMLElement
    expect(host.style.boxShadow).toBe('0 1px 3px rgba(0,0,0,0.1)')
    expect(host.style.width).toBe('42px')
  })

  it('drops the inline style when the selection says so', () => {
    const { container } = render(<Frame variant="raised" disabled />)
    expect((container.firstElementChild as HTMLElement).style.boxShadow).toBe('')
  })
})

describe('styled() inline-style lane — open-domain props argument', () => {
  interface InsetBaseProps {
    inset?: number
    className?: string
    // Component bases get the RN style contract (arrays allowed, later wins);
    // this DOM test host flattens like an RN host would.
    style?: CSSProperties | ReadonlyArray<CSSProperties>
  }
  const InsetBase = forwardRef<HTMLDivElement, InsetBaseProps>(function InsetBase(
    { inset: _inset, style, ...rest },
    ref,
  ) {
    const flattened = Array.isArray(style) ? Object.assign({}, ...(style as CSSProperties[])) : style
    return <div ref={ref} style={flattened as CSSProperties | undefined} {...rest} />
  })

  const InsetFrame = styled(InsetBase, {
    base: 'flex-col',
    variants: { row: { true: 'flex-row', false: '' } },
    defaultVariants: { row: false },
    inlineStyle: (selection, props) => {
      const inset = props['inset']
      if (typeof inset !== 'number') {
        return undefined
      }
      // Selection stays the first argument: defaults applied, variants resolved.
      return selection.row === true ? { paddingLeft: inset, paddingRight: inset } : { padding: inset }
    },
  })

  it('computes style values from arbitrary (non-variant) props', () => {
    const { container } = render(<InsetFrame inset={12} />)
    expect((container.firstElementChild as HTMLElement).style.padding).toBe('12px')
  })

  it('hands inlineStyle the resolved variant selection alongside the raw props', () => {
    const { container } = render(<InsetFrame inset={8} row />)
    const host = container.firstElementChild as HTMLElement
    expect(host.style.padding).toBe('')
    expect(host.style.paddingLeft).toBe('8px')
    expect(host.style.paddingRight).toBe('8px')
  })

  it('returns nothing when the driving prop is absent; caller style still wins on conflict', () => {
    const { container } = render(<InsetFrame style={{ padding: 4 }} />)
    expect((container.firstElementChild as HTMLElement).style.padding).toBe('4px')
    const { container: conflicted } = render(<InsetFrame inset={12} style={{ padding: 4 }} />)
    expect((conflicted.firstElementChild as HTMLElement).style.padding).toBe('4px')
  })

  it('one-arg inlineStyle configs keep working unchanged (backward compatibility)', () => {
    const OneArg = styled('div', {
      variants: { big: { true: '', false: '' } },
      defaultVariants: { big: false },
      inlineStyle: (selection) => (selection.big === true ? { width: 100 } : undefined),
    })
    const { container } = render(<OneArg big />)
    expect((container.firstElementChild as HTMLElement).style.width).toBe('100px')
  })

  it('props reaching inlineStyle stay invisible to the class universe (scanner semantics unchanged)', () => {
    expect(collectStyledClasses(InsetFrame.styledConfig)).toEqual(['flex-col', 'flex-row'])
  })
})

describe('styled() inline-style lane — composed factories over a DOM host', () => {
  // The outer factory sees a component base (the inner factory) and hands its
  // style down in RN array form; the DOM host at the bottom of the chain must
  // flatten it — spreading the array into an object would deliver junk
  // numeric keys and silently drop the outer inline style AND the caller's.
  const Inner = styled('div', {
    base: 'flex-col',
    inlineStyle: () => ({ padding: 4 }),
  })
  const Outer = styled(Inner, {
    base: 'flex-row',
    inlineStyle: () => ({ margin: 2 }),
  })

  it('keeps the outer inline style and the caller style when the chain bottoms out at a DOM host', () => {
    const { container } = render(<Outer style={{ width: 10 }} />)
    const host = container.firstElementChild as HTMLElement
    expect(host.style.padding).toBe('4px') // inner config lane
    expect(host.style.margin).toBe('2px') // outer config lane
    expect(host.style.width).toBe('10px') // caller
  })

  it('precedence across the chain: caller > outer config > inner config', () => {
    const OuterConflicting = styled(Inner, {
      inlineStyle: () => ({ padding: 8, margin: 2 }),
    })
    const { container } = render(<OuterConflicting style={{ margin: 1 }} />)
    const host = container.firstElementChild as HTMLElement
    expect(host.style.padding).toBe('8px') // outer overrides inner
    expect(host.style.margin).toBe('1px') // caller overrides outer
  })

  it('flattens an array reaching a DOM host even when the inner config has no inlineStyle', () => {
    const Bare = styled('div', { base: 'flex-col' })
    const OuterOverBare = styled(Bare, { inlineStyle: () => ({ margin: 2 }) })
    const { container } = render(<OuterOverBare style={{ width: 10 }} />)
    const host = container.firstElementChild as HTMLElement
    expect(host.style.margin).toBe('2px')
    expect(host.style.width).toBe('10px')
  })

  // RN's style contract admits shapes a DOM host cannot render (Pressable
  // state FUNCTIONS, registered-StyleSheet NUMBERS). Dev fails loudly at the
  // seam; production drops the entry instead of crashing the subtree —
  // aligned with the factory's other dev-gated guards.
  it('rejects non-object style entries reaching a DOM host loudly in dev', () => {
    const Bare = styled('div', { base: 'flex-col' })
    expect(() => render(<Bare style={(() => ({})) as never} />)).toThrow(/non-object style/)
  })

  it('drops non-object style entries in production builds instead of crashing the subtree', () => {
    const globals = globalThis as { __DEV__?: boolean }
    globals.__DEV__ = false
    try {
      const Bare = styled('div', { base: 'flex-col' })
      const { container } = render(<Bare style={[{ width: 10 }, (() => ({})) as never] as never} />)
      const host = container.firstElementChild as HTMLElement
      expect(host.style.width).toBe('10px') // the renderable entry survives
    } finally {
      delete globals.__DEV__
    }
  })

  it('collectStyledClasses walks the composed chain — inner classes are in the outer universe', () => {
    const InnerWithVariants = styled('div', {
      base: 'flex-col',
      variants: { tone: { loud: 'bg-surface3', quiet: 'bg-surface2' } },
    })
    const Composed = styled(InnerWithVariants, { base: 'flex-row', variants: { wide: { true: 'items-center' } } })
    // The outer factory can only add classes; every class the INNER factory
    // can emit still reaches the host, so the emission gates must see them.
    expect(collectStyledClasses(Composed.styledConfig)).toEqual(
      ['flex-col', 'bg-surface3', 'bg-surface2', 'flex-row', 'items-center'].sort(),
    )
    // Two levels deep: the walk is recursive, not one hop.
    const Doubled = styled(Composed, { base: 'justify-center' })
    expect(collectStyledClasses(Doubled.styledConfig)).toContain('bg-surface2')
    expect(collectStyledClasses(Doubled.styledConfig)).toContain('justify-center')
  })
})

interface Captured {
  className?: string
  style?: unknown
  onHoverIn?: () => void
  onHoverOut?: () => void
}

describe('styled() hover lane', () => {
  const captured: Captured = {}
  // markHoverable: the fail-closed hover-seam guard only accepts component
  // bases carrying the static styledHostKind capability marker.
  const Base = markHoverable(
    forwardRef<HTMLDivElement, Captured>(function Base(props, ref) {
      Object.assign(captured, props)
      return <div ref={ref} />
    }),
  )

  const Hoverable = styled(Base, {
    base: 'bg-surface3',
    variants: {
      hoverable: { true: '', false: '' },
      disabled: { true: 'opacity-60', false: '' },
    },
    defaultVariants: { hoverable: true, disabled: false },
    hover: [{ hoverable: true, disabled: false, class: 'bg-surface3-hovered' }],
  })

  it('wires onHoverIn/onHoverOut on non-DOM bases and swaps literal classes with state', () => {
    render(<Hoverable />)
    expect(captured.className).not.toContain('bg-surface3-hovered')
    act(() => captured.onHoverIn?.())
    // tailwind-merge collapses the bg conflict: the hovered class wins.
    expect(captured.className).toBe('bg-surface3-hovered')
    act(() => captured.onHoverOut?.())
    expect(captured.className).toBe('bg-surface3')
  })

  it('suppresses hover classes when a gating variant does not match', () => {
    render(<Hoverable disabled />)
    act(() => captured.onHoverIn?.())
    expect(captured.className).not.toContain('bg-surface3-hovered')
    act(() => captured.onHoverOut?.())
  })

  it('touch pointers never apply hover classes (pointerType filter, both seams)', () => {
    // Native seam: onHoverIn carrying a touch pointerType is ignored.
    render(<Hoverable />)
    act(() => (captured.onHoverIn as unknown as (event: unknown) => void)({ nativeEvent: { pointerType: 'touch' } }))
    expect(captured.className).toBe('bg-surface3')
    act(() => (captured.onHoverIn as unknown as (event: unknown) => void)({ pointerType: 'mouse' }))
    expect(captured.className).toBe('bg-surface3-hovered')
    act(() => captured.onHoverOut?.())
    // DOM seam: a touch-derived pointerenter is ignored; mouse applies.
    // React's onPointerEnter listens for pointerover.
    function firePointerEnter(element: HTMLElement, pointerType: string): void {
      act(() => {
        element.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, cancelable: true, pointerType }))
      })
    }
    const Dom = styled('div', { base: 'bg-surface2', hover: [{ class: 'bg-surface2-hovered' }] })
    const { container } = render(<Dom />)
    const element = container.firstElementChild as HTMLElement
    firePointerEnter(element, 'touch')
    expect(element.className).toBe('bg-surface2')
    firePointerEnter(element, 'mouse')
    expect(element.className).toBe('bg-surface2-hovered')
    act(() => {
      fireEvent.pointerLeave(element)
    })
    expect(element.className).toBe('bg-surface2')
  })

  it('propagates the host kind through composed chains (the DOM signal is not the immediate base shape)', () => {
    const Inner = styled('div', { base: 'p-1' })
    const Outer = styled(Inner, { base: 'p-2' })
    expect((Outer as unknown as { styledHostKind?: string }).styledHostKind).toBe('dom')
    expect((styled(Base, { base: 'p-1' }) as unknown as { styledHostKind?: string }).styledHostKind).toBe(
      'native-hoverable',
    )
  })
})

describe('styled() hover precedence — active hover beats static classes from any source', () => {
  // The hover seam only attaches on the innermost styled() call, so a
  // composed OUTER factory's classes ride in through `className`; an active
  // hover class must still beat them (and the caller's), matching legacy
  // Tamagui: getSplitStyles merges pseudo styles at descriptor.priority
  // (hoverStyle = 2) over static props at importance 0, regardless of whether
  // the static prop came from config, a composed wrapper, or the caller.
  const InnerHover = styled('div', {
    base: 'bg-surface2',
    hover: [{ class: 'bg-surface2-hovered' }],
  })
  const OuterStatic = styled(InnerHover, { base: 'bg-surface3' })

  it('composition × hover: the ACTIVE hover class wins over a conflicting static class from the composed outer factory', () => {
    const { container } = render(<OuterStatic />)
    const element = container.firstElementChild as HTMLElement
    // At rest the outer factory's static class wins the bg conflict.
    expect(element.className).toBe('bg-surface3')
    act(() => {
      fireEvent.pointerEnter(element)
    })
    expect(element.className).toBe('bg-surface2-hovered')
    act(() => {
      fireEvent.pointerLeave(element)
    })
    expect(element.className).toBe('bg-surface3')
  })

  it('the ACTIVE hover class wins over the caller className too (legacy hoverStyle importance); hover: classes stay the caller override channel', () => {
    const { container } = render(<InnerHover className="bg-surface3" />)
    const element = container.firstElementChild as HTMLElement
    expect(element.className).toBe('bg-surface3')
    act(() => {
      fireEvent.pointerEnter(element)
    })
    expect(element.className).toBe('bg-surface2-hovered')
    act(() => {
      fireEvent.pointerLeave(element)
    })
    expect(element.className).toBe('bg-surface3')
    // A caller `hover:` class is a different tailwind-merge group — it
    // survives the merge and out-specifies the state-driven class in real
    // CSS, mirroring a legacy caller overriding via their own hoverStyle.
    const { container: overridden } = render(<InnerHover className="hover:bg-surface1" />)
    const overriddenElement = overridden.firstElementChild as HTMLElement
    act(() => {
      fireEvent.pointerEnter(overriddenElement)
    })
    expect(overriddenElement.className.split(/\s+/)).toContain('hover:bg-surface1')
    expect(overriddenElement.className.split(/\s+/)).toContain('bg-surface2-hovered')
  })
})

describe('styled() definition-time validation', () => {
  it('throws on hover:/group-hover: classes (dead on native)', () => {
    expect(() => styled('div', { base: 'hover:bg-surface3' })).toThrow(/hover:/)
    expect(() => styled('div', { variants: { active: { true: 'group-hover:opacity-100', false: '' } } })).toThrow(
      /group-/,
    )
  })

  it('throws on media-* compat variants and native-throwing shadow classes', () => {
    expect(() => styled('div', { base: 'media-md:flex-col' })).toThrow(/media-/)
    expect(() => styled('div', { base: 'shadow-short' })).toThrow(/shadow/)
  })

  it('throws when hover rules are declared over a base where the seam cannot attach', () => {
    const Composed = styled('div', { base: 'p-1' })
    expect(() => styled(Composed, { hover: [{ class: 'opacity-[0.8]' }] })).toThrow(/innermost styled\(\) call/)
    function View(): null {
      return null
    }
    expect(() => styled(View, { hover: [{ class: 'opacity-[0.8]' }] })).toThrow(/styledHostKind/)
    // The same bases stay legal without hover rules.
    expect(() => styled(Composed, { base: 'p-2' })).not.toThrow()
    expect(() => styled(View, { base: 'p-2' })).not.toThrow()
  })

  it('hover-seam guard fails CLOSED: unmarked component bases throw; the static capability marker passes', () => {
    // An unmarked wrapper is indistinguishable from a hoverless host — the
    // guard must not fall through to a silent dead hover lane. Names prove
    // nothing (minified in prod, shared by hoverless wrappers), so even
    // Pressable-sounding names throw without the marker.
    function FancyBox(): null {
      return null
    }
    expect(() => styled(FancyBox, { hover: [{ class: 'opacity-[0.8]' }] })).toThrow(/fail closed/)
    const anonymous = forwardRef<HTMLDivElement, Record<string, unknown>>((_props, ref) => <div ref={ref} />)
    expect(() => styled(anonymous, { hover: [{ class: 'opacity-[0.8]' }] })).toThrow(/styledHostKind/)
    function MyPressable(): null {
      return null
    }
    expect(() => styled(MyPressable, { hover: [{ class: 'opacity-[0.8]' }] })).toThrow(/styledHostKind/)
    // The documented escape: the static marker, via markHoverable or hand-declared.
    expect(() => styled(markHoverable(MyPressable), { hover: [{ class: 'opacity-[0.8]' }] })).not.toThrow()
    const handMarked = Object.assign(
      function Wrapper(): null {
        return null
      },
      { styledHostKind: 'native-hoverable' as const },
    )
    expect(() => styled(handMarked, { hover: [{ class: 'opacity-[0.8]' }] })).not.toThrow()
  })

  it('denies behavioural DOM attribute variant names on a DOM base unless forwarded', () => {
    expect(() => styled('button', { variants: { disabled: { true: 'opacity-60', false: '' } } })).toThrow(
      /behavioural DOM attribute/,
    )
    expect(() =>
      styled('button', { variants: { disabled: { true: 'opacity-60', false: '' } }, forwardProps: ['disabled'] }),
    ).not.toThrow()
    // Component bases keep their own prop contracts — no DOM-attribute denial.
    function View(): null {
      return null
    }
    expect(() => styled(View, { variants: { disabled: { true: 'opacity-60', false: '' } } })).not.toThrow()
  })

  it('rejects className/style/ref/key/children as variant names on any base', () => {
    for (const reserved of ['className', 'style', 'ref', 'key', 'children']) {
      expect(() => styled('div', { variants: { [reserved]: { true: '', false: '' } } })).toThrow(/reserved/)
    }
  })

  it('throws on stacked-variant usages of banned families (normalized per token)', () => {
    expect(() => styled('div', { base: 'dark:hover:bg-surface3' })).toThrow(/hover:/)
    expect(() => styled('div', { base: 'focus-visible:opacity-100' })).toThrow(/focus-visible/)
    expect(() => styled('div', { base: 'peer-hover:opacity-100' })).toThrow(/peer/)
    expect(() => styled('div', { base: 'aria-[busy]:opacity-50' })).toThrow(/aria-/)
    expect(() => styled('div', { base: 'focus:outline-2' })).toThrow(/outline/)
    // Arbitrary-value colons are NOT variant separators.
    expect(() => styled('div', { base: '[font-weight:500]' })).not.toThrow()
    expect(() => styled('div', { base: 'focus:border-surface3' })).not.toThrow()
  })

  it('platform: "web" lifts the native-MISS bans but never the always-broken ones', () => {
    expect(() => styled('div', { platform: 'web', base: 'hover:bg-surface3 media-md:flex-col' })).not.toThrow()
    expect(() => styled('div', { platform: 'web', base: 'shadow-short' })).toThrow(/shadow/)
    expect(() => styled('div', { platform: 'web', base: 'elevation-2' })).toThrow(/elevation/)
  })

  it('collectStyledClasses fails loudly on a hand-mutated baseStyledConfig cycle', () => {
    const Inner = styled('div', { base: 'p-1' })
    const Outer = styled(Inner, { base: 'p-2' })
    const outerConfig = Outer.styledConfig as { baseStyledConfig?: unknown }
    const innerConfig = Inner.styledConfig as { baseStyledConfig?: unknown }
    innerConfig.baseStyledConfig = Outer.styledConfig
    try {
      expect(() => collectStyledClasses(Outer.styledConfig)).toThrow(/cycle/)
    } finally {
      delete innerConfig.baseStyledConfig
      void outerConfig
    }
  })

  it('throws when forwardProps names an undeclared variant', () => {
    expect(() =>
      styled('div', {
        variants: { row: { true: 'flex-row', false: '' } },
        // @ts-expect-error caught at the type level too; the runtime guard below covers JS callers
        forwardProps: ['nope'],
      }),
    ).toThrow(/forwardProps/)
  })

  it('collectStyledClasses enumerates the full class universe', () => {
    expect(collectStyledClasses(Frame.styledConfig)).toEqual(
      [
        'rounded-12',
        'bg-transparent',
        'items-center',
        'justify-center',
        'flex-row',
        'flex-col',
        'opacity-60',
        'border',
        'border-surface3',
        'bg-surface3',
        'bg-surface2',
        'bg-surface3-hovered',
      ].sort(),
    )
  })

  it('validateStyledClasses passes for the fixture config', () => {
    expect(() => validateStyledClasses({ config: Frame.styledConfig, componentName: 'Frame' })).not.toThrow()
  })
})

describe('styled() typing', () => {
  /* oxlint-disable universe-custom/styled-factory-literal-classes -- deliberate negative cases: computed and
     holed class values that the syntax rule (like the LiteralClass type guard it backstops) must reject */
  it('rejects computed class strings and unknown variant values at the type level', () => {
    const dynamic = ['bg', 'surface3'].join('-')
    // @ts-expect-error computed strings widen to `string` and fail LiteralClass
    const rejected = styled('div', { variants: { tone: { loud: dynamic } } })
    // @ts-expect-error `giant` is not a declared option of `variant`
    const rejectedElement = <Frame variant="giant" />
    type FrameProps = GetProps<typeof Frame>
    const props: FrameProps = { variant: 'outlined', centered: true, className: 'gap-2' }
    expect(rejected).toBeDefined()
    expect(rejectedElement).toBeDefined()
    expect(props.variant).toBe('outlined')
  })

  it('rejects template-literal types with holes (the case `string extends S` missed)', () => {
    const suffix = ['sur', 'face3'].join('')
    const holed: `bg-${string}` = `bg-${suffix}`
    // @ts-expect-error `bg-${string}` has an open domain — not a literal class
    const rejectedBase = styled('div', { base: holed })
    // @ts-expect-error `bg-${string}` fails LiteralClass in a variant branch too
    const rejectedBranch = styled('div', { variants: { tone: { loud: holed } } })
    expect(rejectedBase).toBeDefined()
    expect(rejectedBranch).toBeDefined()
  })

  it('rejects computed class strings on compoundVariants and hover rules', () => {
    const dynamic = ['bg', 'surface2'].join('-')
    const rejectedCompound = styled('div', {
      variants: { tone: { loud: '', quiet: '' } },
      // @ts-expect-error a computed compound `class` widens to `string` and fails LiteralRuleClasses
      compoundVariants: [{ tone: 'loud', class: dynamic }],
    })
    const rejectedHover = styled('div', {
      // @ts-expect-error a computed hover `class` widens to `string` and fails LiteralRuleClasses
      hover: [{ class: dynamic }],
    })
    expect(rejectedCompound).toBeDefined()
    expect(rejectedHover).toBeDefined()
  })
  /* oxlint-enable universe-custom/styled-factory-literal-classes */

  it('rejects a hand-written baseStyledConfig — the factory owns that link', () => {
    const Inner = styled('div', { base: 'p-1' })
    const rejected = styled('div', {
      base: 'p-2',
      // @ts-expect-error baseStyledConfig lives on ExposedStyledConfig, not the public StyledConfig
      baseStyledConfig: Inner.styledConfig,
    })
    expect(rejected).toBeDefined()
  })

  it('inlineStyle can only return the platform style shape — a className can never be smuggled out', () => {
    const smuggledString = styled('div', {
      // @ts-expect-error a bare string (class list) is not a style object
      inlineStyle: () => 'bg-surface3',
    })
    const smuggledArray = styled('div', {
      // @ts-expect-error a class-list array is not a style object
      inlineStyle: () => ['bg-surface3', 'flex-row'],
    })
    const smuggledKey = styled('div', {
      // @ts-expect-error a style object cannot carry a `className` key
      inlineStyle: () => ({ className: 'bg-surface3' }),
    })
    const smuggledClassKey = styled('div', {
      // @ts-expect-error a style object cannot carry a `class` key
      inlineStyle: () => ({ class: 'bg-surface3' }),
    })
    expect(smuggledString).toBeDefined()
    expect(smuggledArray).toBeDefined()
    expect(smuggledKey).toBeDefined()
    expect(smuggledClassKey).toBeDefined()
  })
})

/**
 * Behavior pinned by the batch stress test (INFRA styled-factory batch):
 * hazards and semantics the parity conversions relied on, characterized here
 * so a factory (or dependency) change that shifts them fails loudly.
 */
describe('styled() batch-stress-test characterizations', () => {
  it('hover rule with no variant keys applies whenever hovered; unset variants never match rule requirements', () => {
    const Tab = styled('span', {
      variants: {
        active: { true: '', false: '' },
      },
      hover: [{ class: 'opacity-[0.8]' }, { active: true, class: 'opacity-[1]' }],
    })
    const { container } = render(<Tab />)
    const element = container.firstElementChild as HTMLElement
    act(() => {
      fireEvent.pointerEnter(element)
    })
    // Keyless rule fires; the `active: true` rule must NOT (active is unset).
    expect(element.className.split(/\s+/)).toContain('opacity-[0.8]')
    expect(element.className.split(/\s+/)).not.toContain('opacity-[1]')
  })

  it('later hover rules win conflicting classes via tailwind-merge', () => {
    const Tab = styled('span', {
      variants: { disabled: { true: '', false: '' } },
      forwardProps: ['disabled'],
      hover: [{ class: 'opacity-[0.8]' }, { disabled: true, class: 'opacity-[1]' }],
    })
    const { container } = render(<Tab disabled />)
    const element = container.firstElementChild as HTMLElement
    act(() => {
      fireEvent.pointerEnter(element)
    })
    expect(element.className.split(/\s+/)).toContain('opacity-[1]')
    expect(element.className.split(/\s+/)).not.toContain('opacity-[0.8]')
  })

  /**
   * KNOWN HAZARD (house tailwind-merge): the font-size group (`text-[13px]`)
   * conflicts with `leading-*`, so a variant that changes ONLY the font size
   * silently deletes an earlier `leading-*` from the base. Same behavior
   * text-compat documents; its escape is `[line-height:…]` (an arbitrary
   * PROPERTY, which merges by property name). Conversion vocabulary rule:
   * pair every `leading-*` with the font-size in the SAME branch, or use
   * `[line-height:…]`.
   */
  it('tailwind-merge drops an earlier leading-* when a later branch sets only text-[…] (documented hazard)', () => {
    const Sized = styled('span', {
      base: 'text-[15px] leading-[19.5px]',
      variants: { small: { true: 'text-[13px]', false: '' } },
    })
    const { container } = render(<Sized small />)
    const classes = (container.firstElementChild as HTMLElement).className.split(/\s+/)
    expect(classes).toContain('text-[13px]')
    expect(classes).not.toContain('leading-[19.5px]') // silently dropped — the hazard
    // The arbitrary-property spelling survives:
    const SizedSafe = styled('span', {
      base: 'text-[15px] [line-height:19.5px]',
      variants: { small: { true: 'text-[13px]', false: '' } },
    })
    const { container: safe } = render(<SizedSafe small />)
    const safeClasses = (safe.firstElementChild as HTMLElement).className.split(/\s+/)
    expect(safeClasses).toContain('[line-height:19.5px]')
  })

  it('factory-over-factory composition: child classes ride in as className and win the merge', () => {
    const Parent = styled('div', { base: 'flex-row items-center justify-center p-2' })
    const Child = styled(Parent, { base: 'justify-start p-1' })
    const { container } = render(<Child />)
    const classes = (container.firstElementChild as HTMLElement).className.split(/\s+/)
    expect(classes).toContain('justify-start')
    expect(classes).not.toContain('justify-center')
    expect(classes).toContain('p-1')
    expect(classes).not.toContain('p-2')
  })
})
