/**
 * Token resolution in the shared class emitter (INFRA-3232).
 *
 * `border*Width`, `zIndex`, `shadowRadius` and `shadowOffset` are token-valued
 * on the legacy Tamagui props (`SpaceKeys` / `SizeKeys` / `ZIndexKeys`), so the
 * compat props accept those tokens and the emitter must resolve them to px /
 * layer numbers. Before this, a token interpolated raw (`border-[$spacing1px]`)
 * and produced a dead class. The numeric path must stay byte-identical.
 */
// Type-only — never a runtime react-native import in a file shared by both platform legs (packages/mycelium/CLAUDE.md).
import type { OpaqueColorValue } from 'react-native'
import { describe, expect, it } from 'vitest'
import { flexCompatClassName } from '../flex-compat/compile'
import type { FlexCompatProps } from '../flex-compat/props'
import { zIndexes } from '../tokens'
import { COLOR_TOKEN_CLASS, colorTokenCssValue, outlineColorClasses, THEMED_COLOR_TOKEN_CLASSES } from './tokens'

// Mirrors the shape `PlatformColor()`/`DynamicColor()` actually return at runtime (a plain
// object) — `OpaqueColorValue`'s `symbol`-branded TS type is a construction guard, not the
// real runtime value, so a real `Symbol()` here would exercise the wrong `String()` behavior.
const FAKE_OPAQUE_COLOR = { semantic: ['systemRedColor'] } as unknown as OpaqueColorValue

const has = (className: string, cls: string): boolean => className.split(' ').includes(cls)

const boxShadow = (className: string): string | undefined =>
  className.split(' ').find((cls) => cls.startsWith('[box-shadow:'))

describe('borderWidth token resolution', () => {
  it.each([
    ['$none', 'border-[0px]'],
    ['$spacing1', 'border-[1px]'],
    ['$spacing2', 'border-[2px]'],
    ['$spacing8', 'border-[8px]'],
    ['$true', 'border-[8px]'],
  ] as const)('resolves borderWidth %s to %s', (borderWidth, cls) => {
    expect(has(flexCompatClassName({ borderWidth }), cls)).toBe(true)
  })

  it('$none is byte-identical to the numeric zero the compat has always emitted', () => {
    expect(flexCompatClassName({ borderWidth: '$none' })).toBe(flexCompatClassName({ borderWidth: 0 }))
  })

  it('keeps numeric widths byte-identical (the 0.5 hairline included)', () => {
    expect(has(flexCompatClassName({ borderWidth: 0.5 }), 'border-[0.5px]')).toBe(true)
    expect(has(flexCompatClassName({ borderWidth: 1 }), 'border-[1px]')).toBe(true)
  })

  it('resolves the per-side widths', () => {
    const className = flexCompatClassName({
      borderTopWidth: '$spacing1',
      borderBottomWidth: '$spacing2',
      borderLeftWidth: '$none',
      borderRightWidth: '$spacing4',
    })
    expect(has(className, 'border-t-[1px]')).toBe(true)
    expect(has(className, 'border-b-[2px]')).toBe(true)
    expect(has(className, 'border-l-[0px]')).toBe(true)
    expect(has(className, 'border-r-[4px]')).toBe(true)
  })

  it('throws on an unknown border-width token', () => {
    expect(() => flexCompatClassName({ borderWidth: '$nope' as never })).toThrow(
      /unknown border-width space token "\$nope"/,
    )
    expect(() => flexCompatClassName({ borderTopWidth: '$nope' as never })).toThrow(
      /unknown border-width space token "\$nope"/,
    )
  })
})

describe('zIndex token resolution', () => {
  it.each([
    ['$default', `z-[${zIndexes.default}]`],
    ['$modal', `z-[${zIndexes.modal}]`],
    ['$tooltip', `z-[${zIndexes.tooltip}]`],
    ['$negative', `z-[${zIndexes.negative}]`],
    ['$true', `z-[${zIndexes.default}]`],
  ] as const)('resolves zIndex %s to %s', (zIndex, cls) => {
    expect(has(flexCompatClassName({ zIndex }), cls)).toBe(true)
  })

  it('keeps numeric layers byte-identical', () => {
    expect(has(flexCompatClassName({ zIndex: 42 }), 'z-[42]')).toBe(true)
  })

  it('throws on an unknown zIndex token', () => {
    expect(() => flexCompatClassName({ zIndex: '$nope' as never })).toThrow(/unknown zIndex token "\$nope"/)
  })
})

describe('borderRadius $true', () => {
  it('resolves to the legacy radius.true alias (borderRadii.none)', () => {
    expect(has(flexCompatClassName({ borderRadius: '$true' }), 'rounded-[0px]')).toBe(true)
    expect(flexCompatClassName({ borderRadius: '$true' })).toBe(flexCompatClassName({ borderRadius: '$none' }))
  })
})

describe('per-corner radius token resolution', () => {
  it.each([
    [{ borderTopLeftRadius: '$rounded12' }, '[border-top-left-radius:12px]'],
    [{ borderTopRightRadius: '$rounded8' }, '[border-top-right-radius:8px]'],
    [{ borderBottomLeftRadius: '$rounded12' }, '[border-bottom-left-radius:12px]'],
    [{ borderBottomRightRadius: '$rounded4' }, '[border-bottom-right-radius:4px]'],
    [{ borderTopStartRadius: '$rounded16' }, '[border-start-start-radius:16px]'],
    [{ borderTopEndRadius: '$rounded16' }, '[border-start-end-radius:16px]'],
    [{ borderBottomStartRadius: '$rounded20' }, '[border-end-start-radius:20px]'],
    [{ borderBottomEndRadius: '$rounded20' }, '[border-end-end-radius:20px]'],
    [{ borderStartStartRadius: '$rounded6' }, '[border-start-start-radius:6px]'],
    [{ borderStartEndRadius: '$rounded6' }, '[border-start-end-radius:6px]'],
    [{ borderEndStartRadius: '$rounded24' }, '[border-end-start-radius:24px]'],
    [{ borderEndEndRadius: '$rounded24' }, '[border-end-end-radius:24px]'],
  ] as const)('resolves %o to %s', (props, cls) => {
    expect(has(flexCompatClassName(props), cls)).toBe(true)
  })

  it('a token resolves byte-identical to the numeric px the long tail has always emitted', () => {
    expect(flexCompatClassName({ borderBottomLeftRadius: '$rounded12' })).toBe(
      flexCompatClassName({ borderBottomLeftRadius: 12 }),
    )
  })

  it('resolves $true to the legacy radius.true alias, like borderRadius', () => {
    expect(flexCompatClassName({ borderTopLeftRadius: '$true' })).toBe(
      flexCompatClassName({ borderTopLeftRadius: '$none' }),
    )
  })

  it('throws on an unknown radius token, naming the offending corner prop', () => {
    expect(() => flexCompatClassName({ borderTopLeftRadius: '$nope' })).toThrow(
      /unknown borderTopLeftRadius token "\$nope"/,
    )
    expect(() => flexCompatClassName({ borderBottomEndRadius: '$nope' })).toThrow(
      /unknown borderBottomEndRadius token "\$nope"/,
    )
  })

  it('throws on an unknown borderRadius token, naming the prop', () => {
    expect(() => flexCompatClassName({ borderRadius: '$nope' as never })).toThrow(/unknown borderRadius token "\$nope"/)
  })

  it('keeps throwing on $ tokens for long-tail props outside every token family', () => {
    expect(() => flexCompatClassName({ cursor: '$spacing4' })).toThrow(
      /token value "\$spacing4" for "cursor" has no @universe\/tailwind counterpart/,
    )
    expect(() => flexCompatClassName({ backgroundImage: '$accent1' })).toThrow(
      /token value "\$accent1" for "backgroundImage" has no @universe\/tailwind counterpart/,
    )
  })
})

describe('per-side / logical border color token resolution (INFRA-3339)', () => {
  it.each([
    [{ borderTopColor: '$surface3' }, '[border-top-color:var(--surface3)]'],
    [{ borderBottomColor: '$neutral2' }, '[border-bottom-color:var(--neutral2)]'],
    [{ borderLeftColor: '$accent1' }, '[border-left-color:var(--accent1)]'],
    [{ borderRightColor: '$statusCritical' }, '[border-right-color:var(--critical)]'],
    [{ borderStartColor: '$surface2' }, '[border-inline-start-color:var(--surface2)]'],
    [{ borderEndColor: '$neutral3' }, '[border-inline-end-color:var(--neutral3)]'],
    [{ borderBlockColor: '$surface4' }, '[border-block-color:var(--surface4)]'],
    [{ borderBlockStartColor: '$statusSuccess' }, '[border-block-start-color:var(--success)]'],
    [{ borderBlockEndColor: '$statusWarning' }, '[border-block-end-color:var(--warning)]'],
    [{ borderInlineColor: '$surface5' }, '[border-inline-color:var(--surface5)]'],
    [{ borderInlineStartColor: '$accent2' }, '[border-inline-start-color:var(--accent2)]'],
    [{ borderInlineEndColor: '$neutral1' }, '[border-inline-end-color:var(--neutral1)]'],
    [{ outlineColor: '$accent1' }, '[outline-color:var(--accent1)]'],
    [{ caretColor: '$neutral1' }, '[caret-color:var(--neutral1)]'],
  ] as const)('resolves %o to %s', (props, cls) => {
    expect(has(flexCompatClassName(props), cls)).toBe(true)
  })

  it('theme-invariant tokens read the pinned palette var, like the outline/shadow lanes', () => {
    expect(has(flexCompatClassName({ borderTopColor: '$white' }), '[border-top-color:var(--color-white)]')).toBe(true)
    expect(has(flexCompatClassName({ caretColor: '$transparent' }), '[caret-color:var(--color-transparent)]')).toBe(
      true,
    )
  })

  it('themed hovered tokens ride the auto-switching light-suffix var — one class, no dark: sibling', () => {
    const className = flexCompatClassName({ borderTopColor: '$surface1Hovered' })
    expect(has(className, '[border-top-color:var(--surface1-hovered)]')).toBe(true)
    expect(className.split(' ').some((cls) => cls.startsWith('dark:'))).toBe(false)
  })

  it('non-token color strings keep the verbatim arbitrary-property path, byte-identical', () => {
    expect(has(flexCompatClassName({ borderTopColor: '#112233' }), '[border-top-color:#112233]')).toBe(true)
  })

  it('rejected ledger tokens ($accent3 and friends) keep throwing on the FLEX lane (Text resolves $accent3 via its pinned palette — text-compat/compile.test.ts)', () => {
    expect(() => flexCompatClassName({ borderTopColor: '$accent3' })).toThrow(/no @universe\/tailwind counterpart/)
    expect(() => flexCompatClassName({ outlineColor: '$outlineColor' })).toThrow(/no @universe\/tailwind counterpart/)
  })

  it('$shadowColor/$shadowColorHover ride the auto-switching var on the shadow lane (widened from the rejection ledger)', () => {
    expect(boxShadow(flexCompatClassName({ shadowColor: '$shadowColor', shadowRadius: 4 }))).toContain(
      'var(--shadow-color)',
    )
    expect(boxShadow(flexCompatClassName({ shadowColor: '$shadowColorHover', shadowRadius: 4 }))).toContain(
      'var(--shadow-color-hover)',
    )
  })

  it('throws on an unknown color token', () => {
    expect(() => flexCompatClassName({ borderBottomColor: '$nope' })).toThrow(/no @universe\/tailwind counterpart/)
  })

  it('drops a legacy OpaqueColorValue instead of compiling String(value)\'s "[object Object]" (INFRA-3804)', () => {
    const className = flexCompatClassName({ borderTopColor: FAKE_OPAQUE_COLOR } as unknown as FlexCompatProps)
    expect(className).not.toContain('object Object')
    expect(className.split(' ').some((cls) => cls.startsWith('[border-top-color:'))).toBe(false)
  })
})

describe('logical space / inset / border-width / outline token resolution (INFRA-3339)', () => {
  it.each([
    [{ marginStart: '$spacing12' }, '[margin-inline-start:12px]'],
    [{ marginEnd: '$spacing4' }, '[margin-inline-end:4px]'],
    [{ paddingStart: '$spacing8' }, '[padding-inline-start:8px]'],
    [{ paddingEnd: '$spacing16' }, '[padding-inline-end:16px]'],
    [{ start: '$spacing8' }, '[inset-inline-start:8px]'],
    [{ end: '$spacing24' }, '[inset-inline-end:24px]'],
    [{ borderStartWidth: '$spacing2' }, '[border-inline-start-width:2px]'],
    [{ borderEndWidth: '$spacing1' }, '[border-inline-end-width:1px]'],
    [{ outlineWidth: '$spacing2' }, '[outline-width:2px]'],
    [{ outlineOffset: '$spacing4' }, '[outline-offset:4px]'],
  ] as const)('resolves %o to %s', (props, cls) => {
    expect(has(flexCompatClassName(props), cls)).toBe(true)
  })

  it('a token resolves byte-identical to the numeric px the long tail has always emitted', () => {
    expect(flexCompatClassName({ marginStart: '$spacing12' })).toBe(flexCompatClassName({ marginStart: 12 }))
    expect(flexCompatClassName({ outlineWidth: '$spacing2' })).toBe(flexCompatClassName({ outlineWidth: 2 }))
  })

  it('resolves the $true / $none aliases like the space shorthands', () => {
    expect(has(flexCompatClassName({ marginStart: '$true' }), '[margin-inline-start:8px]')).toBe(true)
    expect(has(flexCompatClassName({ paddingEnd: '$none' }), '[padding-inline-end:0px]')).toBe(true)
  })

  it('throws on an unknown space token, naming the offending longhand', () => {
    expect(() => flexCompatClassName({ marginStart: '$nope' })).toThrow(/unknown marginStart token "\$nope"/)
    expect(() => flexCompatClassName({ outlineWidth: '$nope' })).toThrow(/unknown outlineWidth token "\$nope"/)
  })
})

describe('logical size token resolution (INFRA-3339)', () => {
  it.each([
    [{ blockSize: '$spacing48' }, '[block-size:48px]'],
    [{ inlineSize: '$spacing60' }, '[inline-size:60px]'],
    [{ minBlockSize: '$spacing24' }, '[min-block-size:24px]'],
    [{ maxBlockSize: '$spacing48' }, '[max-block-size:48px]'],
    [{ minInlineSize: '$spacing16' }, '[min-inline-size:16px]'],
    [{ maxInlineSize: '$spacing60' }, '[max-inline-size:60px]'],
  ] as const)('resolves %o to %s', (props, cls) => {
    expect(has(flexCompatClassName(props), cls)).toBe(true)
  })

  it('a token resolves byte-identical to the numeric path', () => {
    expect(flexCompatClassName({ blockSize: '$spacing48' })).toBe(flexCompatClassName({ blockSize: 48 }))
  })

  it('throws on an unknown size token, naming the offending longhand', () => {
    expect(() => flexCompatClassName({ blockSize: '$nope' })).toThrow(/unknown blockSize token "\$nope"/)
    expect(() => flexCompatClassName({ maxInlineSize: '$nope' })).toThrow(/unknown maxInlineSize token "\$nope"/)
  })
})

describe('shadow geometry token resolution', () => {
  it('resolves shadowRadius tokens into the box-shadow', () => {
    expect(boxShadow(flexCompatClassName({ shadowRadius: '$spacing4', shadowColor: '$black' }))).toBe(
      boxShadow(flexCompatClassName({ shadowRadius: 4, shadowColor: '$black' })),
    )
  })

  it('resolves both shadowOffset axes', () => {
    expect(
      boxShadow(flexCompatClassName({ shadowOffset: { width: '$spacing2', height: '$spacing8' }, shadowRadius: 0 })),
    ).toBe(boxShadow(flexCompatClassName({ shadowOffset: { width: 2, height: 8 }, shadowRadius: 0 })))
  })

  it('throws on an unknown shadowRadius token', () => {
    expect(() => flexCompatClassName({ shadowRadius: '$nope' as never })).toThrow(
      /unknown border-width space token "\$nope"/,
    )
  })
})

describe('px transform token resolution', () => {
  it('resolves x / y tokens to px translate arguments', () => {
    expect(flexCompatClassName({ x: '$spacing8', y: '$spacing4' })).toBe(flexCompatClassName({ x: 8, y: 4 }))
  })

  it.each([
    ['50%', 'translateX(50%)'],
    ['50vw', 'translateX(50vw)'],
    ['calc(100% - 8px)', 'translateX(calc(100%_-_8px))'],
  ] as const)('emits the non-token x value %s verbatim (typed since INFRA-3258)', (x, fn) => {
    expect(has(flexCompatClassName({ x }), `[transform:${fn}]`)).toBe(true)
  })

  it('emits non-token y values verbatim', () => {
    expect(has(flexCompatClassName({ y: '-25%' }), '[transform:translateY(-25%)]')).toBe(true)
  })

  it('throws only on an unknown $ size token', () => {
    expect(() => flexCompatClassName({ x: '$nope' as never })).toThrow(/unknown size token "\$nope"/)
  })

  it('leaves non-px transform entries alone', () => {
    expect(has(flexCompatClassName({ transform: [{ translateX: '50vw' }] }), '[transform:translateX(50vw)]')).toBe(true)
  })

  // A unitless translateY(-8) is invalid CSS and voids the whole declaration — the hover-reveal presets
  // (AmountInputPresets) pass exactly this RN-keyed array.
  it('gives numeric translateX / translateY array entries px, like x / y', () => {
    expect(
      has(
        flexCompatClassName({ transform: [{ translateY: -8 }, { scale: 0.95 }] }),
        '[transform:translateY(-8px)_scale(0.95)]',
      ),
    ).toBe(true)
  })
})

describe('non-token legacy value family (INFRA-3258)', () => {
  // Legacy Tamagui admits these on every token-categorised prop; the compat
  // types now admit the same curated family and the lanes emit them verbatim.
  it.each([
    [{ p: 'calc(100% - 8px)' }, 'p-[calc(100%_-_8px)]'],
    [{ mt: 'auto' }, 'mt-[auto]'],
    [{ m: '50%' }, 'm-[50%]'],
    [{ paddingLeft: 'var(--gutter)' }, 'pl-[var(--gutter)]'],
    [{ top: '10vh' }, 'top-[10vh]'],
    [{ left: 'min(4px, 1vw)' }, 'left-[min(4px,_1vw)]'],
    [{ gap: '5%' }, 'gap-[5%]'],
    [{ rowGap: 'unset' }, 'gap-y-[unset]'],
    [{ borderWidth: 'unset' }, 'border-[unset]'],
    [{ borderTopWidth: 'var(--hairline)' }, 'border-t-[var(--hairline)]'],
    [{ zIndex: 'var(--layer)' }, 'z-[var(--layer)]'],
    [{ zIndex: 'unset' }, 'z-[unset]'],
    [{ borderRadius: 'inherit' }, 'rounded-[inherit]'],
    [{ borderRadius: 'var(--radius)' }, 'rounded-[var(--radius)]'],
    [{ width: 'max-content' }, 'w-[max-content]'],
    [{ height: 'calc(100vh - 64px)' }, 'h-[calc(100vh_-_64px)]'],
  ] as const)('emits %o as %s', (props, cls) => {
    expect(has(flexCompatClassName(props), cls)).toBe(true)
  })

  it('keeps throwing on unknown $ tokens — the passthrough lane never swallows a typo', () => {
    expect(() => flexCompatClassName({ p: '$spacnig1' as never })).toThrow(/unknown space token "\$spacnig1"/)
    expect(() => flexCompatClassName({ borderWidth: '$nope' as never })).toThrow(
      /unknown border-width space token "\$nope"/,
    )
    expect(() => flexCompatClassName({ zIndex: '$nope' as never })).toThrow(/unknown zIndex token "\$nope"/)
    expect(() => flexCompatClassName({ borderRadius: '$nope' as never })).toThrow(/unknown borderRadius token "\$nope"/)
  })
})

describe('literal CSS lengths pass through, like their numeric twins (INFRA-3258 follow-up)', () => {
  // `spaceTokenPx(1)` already emits `1px`, so the string leg rejecting `'1px'`
  // was a disagreement between the two legs of one resolver rather than a
  // missing feature. Every case asserts the RESOLVED class or the two legs'
  // agreement: asserting only that nothing throws would pass while the value
  // silently landed in the wrong slot.
  it.each([
    ['borderWidth', { borderWidth: '1px' }, { borderWidth: 1 }],
    ['borderTopWidth', { borderTopWidth: '2px' }, { borderTopWidth: 2 }],
    ['top', { top: '1px' }, { top: 1 }],
    ['left', { left: '4px' }, { left: 4 }],
    ['p', { p: '12px' }, { p: 12 }],
    ['gap', { gap: '8px' }, { gap: 8 }],
    ['m', { m: '16px' }, { m: 16 }],
    ['shadowRadius', { shadowRadius: '3px' }, { shadowRadius: 3 }],
  ] as const)('the %s string leg emits exactly what its numeric leg emits', (_prop, asString, asNumber) => {
    expect(flexCompatClassName(asString)).toBe(flexCompatClassName(asNumber))
  })

  // The other units found on the same defect: they failed for the one reason
  // `1px` did, so they are covered here rather than left behind the fix.
  it.each([
    [{ borderWidth: '1px' }, 'border-[1px]'],
    [{ top: '1px' }, 'top-[1px]'],
    [{ bottom: '-2px' }, 'bottom-[-2px]'],
    [{ p: '0.5rem' }, 'p-[0.5rem]'],
    [{ mt: '1em' }, 'mt-[1em]'],
    [{ borderBottomWidth: '12pt' }, 'border-b-[12pt]'],
    [{ paddingLeft: '2.5ch' }, 'pl-[2.5ch]'],
  ] as const)('emits %o as %s', (props, cls) => {
    expect(has(flexCompatClassName(props), cls)).toBe(true)
  })

  // `borderRadius` is fixed at RUNTIME only, hence the casts. `RadiusValue` is
  // built on `CssUniversalValue` alone, and widening it is not free: the
  // sheet-view-props type-parity gate pins mycelium `borderRadius` as
  // assignable to the legacy type. So a caller writing `borderRadius="1px"`
  // still gets a compile error rather than a crash, which is the safe
  // direction. This extends a gap that already applies to percentages and
  // viewport units on the same prop; it is not new here.
  it.each([
    ['6px', 'rounded-[6px]'],
    ['0.5rem', 'rounded-[0.5rem]'],
  ] as const)('resolves borderRadius %s to %s at runtime, though the type still rejects it', (value, cls) => {
    expect(has(flexCompatClassName({ borderRadius: value as never }), cls)).toBe(true)
  })

  // The 12 per-corner props are NOT this lane: they ride the long tail, which
  // passes any non-token string through as an arbitrary property, so a literal
  // length already worked there before this change. Pinned so the two radius
  // paths are not confused for one.
  it('per-corner radius props take the long-tail path, where a literal length already passed through', () => {
    expect(has(flexCompatClassName({ borderTopLeftRadius: '2px' }), '[border-top-left-radius:2px]')).toBe(true)
    expect(
      has(flexCompatClassName({ borderBottomEndRadius: '0.5rem' as never }), '[border-end-end-radius:0.5rem]'),
    ).toBe(true)
  })

  it('the borderRadius string leg still agrees with its numeric leg', () => {
    expect(flexCompatClassName({ borderRadius: '6px' as never })).toBe(flexCompatClassName({ borderRadius: 6 }))
  })

  // THE NEGATIVE HALF, in two parts. Without these, widening the accepted set
  // to anything ending in a unit would satisfy every case above.
  it('rejects a keyword that merely ends in a unit — the length test needs a numeric prefix', () => {
    // `thin` is a legal `border-width` keyword and ends in `in`; a loose suffix
    // match would admit it here, and on `padding`, where it means nothing.
    expect(() => flexCompatClassName({ borderWidth: 'thin' as never })).toThrow(
      /unknown border-width space token "thin"/,
    )
    expect(() => flexCompatClassName({ p: 'thin' as never })).toThrow(/unknown space token "thin"/)
    expect(() => flexCompatClassName({ p: '1 px' as never })).toThrow(/unknown space token "1 px"/)
  })

  // The prefix must be a CSS `<number>`. A bare `Number()` check was not enough:
  // `Number('0x10')` is 16, so `0x10px` used to emit the dead class `p-[0x10px]`.
  it.each([['0x10px'], ['0b101px'], ['0o17px'], ['1.px']] as const)(
    'rejects %s — not a CSS <number> prefix, though Number() would take it',
    (value) => {
      expect(() => flexCompatClassName({ p: value as never })).toThrow(new RegExp(`unknown space token "${value}"`))
    },
  )

  // Scientific notation IS legal CSS `<number>`, so the strict prefix keeps it.
  it('keeps scientific notation, which is a legal CSS number', () => {
    expect(has(flexCompatClassName({ p: '1e3px' as never }), 'p-[1e3px]')).toBe(true)
  })

  it('leaves zIndex alone — unitless, so a length there is nonsense rather than a gap', () => {
    expect(() => flexCompatClassName({ zIndex: '1px' as never })).toThrow(/unknown zIndex token "1px"/)
    expect(() => flexCompatClassName({ zIndex: '0.5rem' as never })).toThrow(/unknown zIndex token "0.5rem"/)
    // And the values it did accept still resolve, so this is not a narrowing.
    expect(has(flexCompatClassName({ zIndex: 'var(--layer)' }), 'z-[var(--layer)]')).toBe(true)
    expect(has(flexCompatClassName({ zIndex: 42 }), 'z-[42]')).toBe(true)
  })
})

describe('Tamagui Variable unwrapping (INFRA-3258)', () => {
  const variable = (val: string | number): { isVar: true; val: string | number; name: string; key: string } => ({
    isVar: true,
    val,
    name: 'test',
    key: 'test',
  })

  it('resolves a Variable to its val on every lane, byte-identical to passing the val', () => {
    expect(flexCompatClassName({ width: variable(100) })).toBe(flexCompatClassName({ width: 100 }))
    expect(flexCompatClassName({ p: variable(8) })).toBe(flexCompatClassName({ p: 8 }))
    expect(flexCompatClassName({ top: variable('50%') })).toBe(flexCompatClassName({ top: '50%' }))
    expect(flexCompatClassName({ zIndex: variable(40) })).toBe(flexCompatClassName({ zIndex: 40 }))
    expect(flexCompatClassName({ borderRadius: variable(12) })).toBe(flexCompatClassName({ borderRadius: 12 }))
    expect(flexCompatClassName({ borderWidth: variable(2) })).toBe(flexCompatClassName({ borderWidth: 2 }))
    expect(flexCompatClassName({ x: variable(8) })).toBe(flexCompatClassName({ x: 8 }))
    expect(flexCompatClassName({ backgroundColor: variable('#112233') })).toBe(
      flexCompatClassName({ backgroundColor: '#112233' }),
    )
    expect(flexCompatClassName({ shadowColor: variable('#112233'), shadowRadius: 4 })).toBe(
      flexCompatClassName({ shadowColor: '#112233', shadowRadius: 4 }),
    )
    expect(flexCompatClassName({ borderTopColor: variable('#112233') })).toBe(
      flexCompatClassName({ borderTopColor: '#112233' }),
    )
    expect(flexCompatClassName({ marginStart: variable(12) })).toBe(flexCompatClassName({ marginStart: 12 }))
  })

  it('a Variable inset is a space value for all four edges, not an edge map', () => {
    expect(flexCompatClassName({ inset: variable(4) })).toBe(flexCompatClassName({ inset: 4 }))
  })

  it('a Variable carrying a $token string still resolves (or throws) like the raw token', () => {
    expect(flexCompatClassName({ p: variable('$spacing8') })).toBe(flexCompatClassName({ p: '$spacing8' }))
    expect(() => flexCompatClassName({ p: variable('$nope') })).toThrow(/unknown space token "\$nope"/)
  })
})

describe('outline color lane shares the long-tail color resolver (one source of truth)', () => {
  it('every semantic token resolves through colorTokenCssValue on both lanes, byte-identical', () => {
    for (const token of Object.keys(COLOR_TOKEN_CLASS)) {
      expect(outlineColorClasses(token)).toEqual([`[outline-color:${colorTokenCssValue(token, 'outlineColor')}]`])
    }
  })

  it('themed hovered tokens are the ONE pinned shape divergence: palette-var pair vs auto-switching collapse', () => {
    // The focus-ring lane ships an explicit light+dark pair (enumerated per
    // token in the generated safelist); the long-tail lane collapses to the
    // auto-switching light alias. Same computed values per theme — changing
    // either shape must flip this pin (and regenerate the safelist), never drift.
    for (const [token, themed] of Object.entries(THEMED_COLOR_TOKEN_CLASSES)) {
      expect(outlineColorClasses(token)).toEqual([
        `[outline-color:var(--color-${themed.light})]`,
        `dark:[outline-color:var(--color-${themed.dark})]`,
      ])
      expect(colorTokenCssValue(token, 'outlineColor')).toBe(`var(--${themed.light})`)
    }
  })

  it('unknown $ tokens throw the shared color-boundary error, naming the outline lane', () => {
    expect(() => outlineColorClasses('$nope')).toThrow(/color token "\$nope" for "outlineColor"/)
  })

  it('raw CSS colors keep the verbatim arbitrary-property path', () => {
    expect(outlineColorClasses('#112233')).toEqual(['[outline-color:#112233]'])
  })
})
