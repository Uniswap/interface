import { getKeys } from 'utilities/src/primitives/objects'
/**
 * Token resolution on the native style lane.
 *
 * Long-tail lane (INFRA-3339): before the fix, `applyLongTail` passed any `$`
 * string through RAW for props in `NATIVE_LONG_TAIL_PROPS` — silent junk on an
 * RN style object. Now every `$` token on the long-tail lane either resolves
 * through its family table (space) or is dropped-and-reported (colors — no
 * per-side semantic native class exists, and a literal would freeze the theme;
 * unknown tokens; every other family).
 *
 * Numeric-token shorthand lanes (INFRA-3272): the INFRA-3232 widening let the
 * number-typed props (`zIndex`, the physical `border*Width`s, shadow geometry,
 * `x`/`y`) admit `$` tokens like legacy Tamagui, and the web leg resolves them
 * at class-emission time — but their builders forwarded them RAW. On device
 * that is a hard crash, not a styling gap: Fabric rejects a string in a
 * number-typed style key (`Exception in HostFunction: Value is a string,
 * expected a number` — first hit by `zIndex="$sticky"` at home-screen mount
 * through the AnimatedFlex base swap, PR #38930). A known token now resolves
 * to the same number the web leg emits; an unknown one drops-and-reports where
 * web throws. Either way a raw `$` string can never reach React Native.
 *
 * Pure-function tests: `compatNativeStyle` builds the style object the
 * `.native` legs mount; the resolved-output evidence lives in
 * `packages/tailwind/src/parity/flex/native-parity.test.tsx`.
 */
import { describe, expect, it } from 'vitest'
import { zIndexes } from '../tokens'
import { NATIVE_LONG_TAIL_PROPS } from './native-long-tail'
import { compatNativeStyle } from './native-style'
import type { CompatStyleProps, LongTailStyleProps } from './props'
import { borderWidthPx, zIndexValue } from './style-classes'
import { SIZE_LONG_TAIL_PROPS } from './style-props'
import { SPACE_TOKEN_PX, Z_INDEX_TOKEN } from './tokens'

/** The full lane surface: the curated props plus the generic long tail. */
type LaneProps = CompatStyleProps & LongTailStyleProps

function styleOf(props: LaneProps): Record<string, unknown> {
  return compatNativeStyle(props).style as Record<string, unknown>
}

function droppedOf(props: LaneProps): string[] {
  return compatNativeStyle(props).dropped
}

/** Props carrying an off-map `$` token, spelled past the literal unions the way an untyped consumer value arrives at runtime. */
function offMap(props: Record<string, unknown>): LaneProps {
  return props as LaneProps
}

describe('native long-tail space token resolution', () => {
  it.each([
    ['marginStart', '$spacing12', 12],
    ['marginEnd', '$spacing4', 4],
    ['paddingStart', '$spacing8', 8],
    ['paddingEnd', '$spacing16', 16],
    ['start', '$spacing8', 8],
    ['end', '$spacing24', 24],
    ['borderStartWidth', '$spacing2', 2],
    ['borderEndWidth', '$spacing1', 1],
    ['outlineWidth', '$spacing2', 2],
    ['outlineOffset', '$spacing4', 4],
  ] as const)('resolves %s %s to %d', (prop, token, px) => {
    const props = { [prop]: token } as LaneProps
    expect(styleOf(props)[prop]).toBe(px)
    expect(droppedOf(props)).toEqual([])
  })

  it('resolves the $true / $none aliases like the shorthand lanes', () => {
    expect(styleOf({ marginStart: '$true' })['marginStart']).toBe(8)
    expect(styleOf({ paddingEnd: '$none' })['paddingEnd']).toBe(0)
  })

  it('drops-and-reports an unknown space token instead of passing it raw', () => {
    const result = compatNativeStyle({ marginStart: '$nope' } as LaneProps)
    expect(result.dropped).toContain('marginStart')
    expect(Object.hasOwn(result.style, 'marginStart')).toBe(false)
  })

  it('keeps numeric and px-string values byte-identical', () => {
    expect(styleOf({ marginStart: 12 })['marginStart']).toBe(12)
    expect(styleOf({ marginStart: '12px' })['marginStart']).toBe(12)
  })
})

describe('native long-tail color tokens drop-and-warn (theme classes cannot exist per side)', () => {
  it.each([
    'borderTopColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRightColor',
    'borderStartColor',
    'borderEndColor',
    'borderBlockColor',
    'borderBlockStartColor',
    'borderBlockEndColor',
    'outlineColor',
  ] as const)('%s with a semantic token is dropped, never a raw $ string', (prop) => {
    const result = compatNativeStyle({ [prop]: '$surface3' } as LaneProps)
    expect(result.dropped).toContain(prop)
    expect(Object.hasOwn(result.style, prop)).toBe(false)
  })

  it('rejected-ledger and unknown color tokens drop the same way', () => {
    expect(droppedOf({ borderTopColor: '$accent3' })).toContain('borderTopColor')
    expect(droppedOf({ borderTopColor: '$nope' })).toContain('borderTopColor')
  })

  it('literal colors still pass through to the style object', () => {
    expect(styleOf({ borderTopColor: '#112233' })['borderTopColor']).toBe('#112233')
  })
})

describe('the native long-tail boundary: no $ string ever reaches an RN style object', () => {
  it('every native long-tail prop either resolves a $ value to a non-$ value or drops it', () => {
    for (const prop of NATIVE_LONG_TAIL_PROPS) {
      // Explicit longTailProps so the Text-only extras (fontVariant, …) are
      // driven through the lane too, exactly as Text's table hands them in.
      const result = compatNativeStyle({ [prop]: '$bogusToken' } as LaneProps, { longTailProps: [prop] })
      const value = (result.style as Record<string, unknown>)[prop]
      const leakedRaw = typeof value === 'string' && value.startsWith('$')
      expect(leakedRaw, `${prop} leaked a raw $ string to RN`).toBe(false)
      if (value === undefined) {
        expect(result.dropped, `${prop} must be reported when unresolvable`).toContain(prop)
      }
    }
  })

  it('web-only color props outside the native set (caretColor, borderInline*) stay dropped', () => {
    for (const prop of ['caretColor', 'borderInlineColor', 'borderInlineStartColor', 'borderInlineEndColor']) {
      const result = compatNativeStyle({ [prop]: '$accent1' } as LaneProps)
      expect(result.dropped).toContain(prop)
      expect(Object.hasOwn(result.style, prop)).toBe(false)
    }
  })
})

describe('the SHORTHAND colour boundary: an unmapped borderColor mirrors the class lane', () => {
  // `colorClasses` drops a `$` token that is in no colour map and has no raw
  // Spore palette literal, and `borderColorDropClasses` turns that drop into
  // `border-transparent` when the SAME style object owns a border width. This
  // leg's style object spreads AFTER the resolved className on device, so handing
  // RN the raw `"$accent3"` string would discard that transparent border with it:
  // `normalizeColor` returns null for the token, `processColor` returns undefined,
  // and the edge paints RN's default BLACK next to the width.
  //
  // Unreachable until the colour lane's throw became a report — `colorClasses`
  // rejected the token before this leg could render — so the passthrough is older
  // than the divergence. Pinned here now that it is reachable.
  it('declares transparent when the same style object owns a border width', () => {
    expect(styleOf(offMap({ borderColor: '$accent3', borderWidth: 1 }))['borderColor']).toBe('transparent')
    // Per-side widths count too, exactly as they do in `borderColorDropClasses`:
    // `{ borderTopWidth: 1 }` is the divider pattern and paints a real edge.
    for (const key of ['borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth'] as const) {
      expect(styleOf(offMap({ borderColor: '$accent3', [key]: 1 }))['borderColor'], key).toBe('transparent')
    }
  })

  it('declares transparent for the LOGICAL width spellings too', () => {
    // `borderStartWidth`/`borderEndWidth` are real RN border-width keys
    // (`react-native/Libraries/StyleSheet/StyleSheetTypes.d.ts`) and reach the RN
    // style object through `applyLongTail`, so without this the edge paints RN's
    // black default exactly as the physical spellings did.
    for (const width of ['borderStartWidth', 'borderEndWidth'] as const) {
      const style = styleOf(offMap({ borderColor: '$accent3', [width]: 1 }))
      expect(style['borderColor'], width).toBe('transparent')
      expect(style[width], width).toBe(1)
    }
  })

  it('declares transparent for the CSS-only logical widths as well, deliberately', () => {
    // RN does not honour `borderInline*`/`borderBlock*` at all — they are absent
    // from its style types, so no native edge paints and the transparent colour is
    // a no-op on device. Declared anyway so the two lanes reach the SAME verdict
    // from the same list: the divergences this lane keeps shipping all came from
    // the two sides disagreeing, and a verdict that is right on web and inert on
    // native is cheaper than a second list to keep in sync.
    for (const width of ['borderInlineStartWidth', 'borderBlockWidth'] as const) {
      expect(styleOf(offMap({ borderColor: '$accent3', [width]: 1 }))['borderColor'], width).toBe('transparent')
    }
  })

  it('does NOT declare transparent for width props that are not border edges', () => {
    for (const width of ['outlineWidth', 'scrollbarWidth'] as const) {
      const style = styleOf(offMap({ borderColor: '$accent3', [width]: 1 }))
      expect(Object.hasOwn(style, 'borderColor'), width).toBe(false)
    }
  })

  it('declares NOTHING when no width asked for a border, so a colour from elsewhere still wins', () => {
    expect(Object.hasOwn(styleOf(offMap({ borderColor: '$accent3' })), 'borderColor')).toBe(false)
  })

  it('never leaks a raw $ string onto borderColor, with or without a width', () => {
    for (const props of [{ borderColor: '$accent3', borderWidth: 1 }, { borderColor: '$accent3' }]) {
      const value = styleOf(offMap(props))['borderColor']
      expect(typeof value === 'string' && value.startsWith('$'), JSON.stringify(props)).toBe(false)
    }
  })

  it('leaves the mapped and literal cases exactly as they were', () => {
    // A semantic token stays on the className so `Uniwind.setTheme()` keeps
    // switching it; a CSS literal still passes straight through.
    expect(Object.hasOwn(styleOf({ borderColor: '$accent1', borderWidth: 1 }), 'borderColor')).toBe(false)
    expect(styleOf({ borderColor: '#123456', borderWidth: 1 })['borderColor']).toBe('#123456')
    // A token WITH a raw palette literal resolves to that literal, through the
    // SAME `PALETTE_COLOR_LITERAL` table the class lane falls back to — not a
    // second copy. It needs no width: unlike the drop, there is a real colour to
    // paint, and a palette literal is theme-invariant so resolving it here cannot
    // freeze a theme.
    expect(styleOf(offMap({ borderColor: '$blueBase', borderWidth: 1 }))['borderColor']).toBe('#4981FF')
    expect(styleOf(offMap({ borderColor: '$blueBase' }))['borderColor']).toBe('#4981FF')
  })

  it('a DROPPED backgroundColor token declares NOTHING, so a colour from elsewhere survives', () => {
    // This was pinned as an inert raw passthrough, on the reasoning that RN
    // discards the unparseable string and the class lane emits no class either, so
    // both lanes land on "no background". That reasoning only holds when NOTHING
    // ELSE supplies a background. It does not survive the fall-through case, which
    // is the whole point of the class lane dropping rather than overriding: when a
    // variant cell or a base class carries `bg-*`, web keeps it (no class is
    // emitted, so the merge leaves the variant alone) while the leg's style object
    // spreads AFTER the resolved className on device — so a raw `"$accent3"` there
    // OVERRIDES the variant's background and is then discarded, painting nothing.
    // Declaring nothing is what actually mirrors the class lane.
    expect(Object.hasOwn(styleOf(offMap({ backgroundColor: '$accent3' })), 'backgroundColor')).toBe(false)
  })

  it('never leaks a raw $ string onto EITHER shorthand colour key', () => {
    // The shorthand twin of the long-tail boundary above: after the drop and
    // palette-literal verdicts, no `$` string can reach an RN style object through
    // `backgroundColor` or `borderColor` either.
    for (const props of [
      { backgroundColor: '$accent3' },
      { backgroundColor: '$blueBase' },
      { borderColor: '$accent3', borderWidth: 1 },
      { borderColor: '$blueBase', borderWidth: 1 },
    ]) {
      const style = styleOf(offMap(props))
      for (const key of ['backgroundColor', 'borderColor'] as const) {
        const value = style[key]
        expect(typeof value === 'string' && value.startsWith('$'), `${key} via ${JSON.stringify(props)}`).toBe(false)
      }
    }
  })

  it('backgroundColor with a PALETTE-LITERAL token resolves the literal, like the border surface', () => {
    // NOT inert, which is why this is a resolve and the case above is a passthrough.
    // The class lane falls back to the literal and emits `bg-[#4981FF]`; that
    // arbitrary class is invisible to uniwind's static scanner, so on device this
    // style object is the only possible carrier of the colour. Passing the raw
    // `"$blueBase"` string meant web painted #4981FF and native painted nothing.
    //
    // Reachable for the same reason both borderColor cases were: `colorClasses`
    // threw for this input at merge-base too, so the leg never got to paint it.
    expect(styleOf(offMap({ backgroundColor: '$blueBase' }))['backgroundColor']).toBe('#4981FF')
    // No width involved on this surface at all, unlike the border drop.
    expect(styleOf(offMap({ backgroundColor: '$blueBase', borderWidth: 1 }))['backgroundColor']).toBe('#4981FF')
  })
})

describe('native long-tail size tokens: a DELIBERATE per-family drop (web resolves, native cannot)', () => {
  it('no logical-size prop is an RN style key, so nativeLongTailToken needs no size branch', () => {
    // If RN ever grows a logical-size key and it lands in NATIVE_LONG_TAIL_PROPS,
    // this pin goes red and forces an explicit resolve-vs-drop decision in
    // nativeLongTailToken (today a size token would silently hit the color drop).
    for (const prop of SIZE_LONG_TAIL_PROPS) {
      expect(NATIVE_LONG_TAIL_PROPS.has(prop), `${prop} unexpectedly joined the native long-tail set`).toBe(false)
    }
  })

  it.each([
    ['blockSize', '$spacing48'],
    ['inlineSize', '$spacing60'],
    ['minBlockSize', '$spacing24'],
    ['maxBlockSize', '$spacing48'],
    ['minInlineSize', '$spacing16'],
    ['maxInlineSize', '$spacing60'],
  ] as const)('%s with a real resolvable token (%s) is dropped-and-reported on native', (prop, token) => {
    // Web resolves these to px ([block-size:48px], style-classes.test.ts);
    // native drops them — RN has no logical-size keys — and reports the drop.
    const result = compatNativeStyle({ [prop]: token } as LaneProps)
    expect(result.dropped).toContain(prop)
    expect(Object.hasOwn(result.style, prop)).toBe(false)
  })
})

describe('zIndex tokens resolve through Z_INDEX_TOKEN (INFRA-3272)', () => {
  it('resolves the crash case: zIndex="$sticky" becomes the sticky layer number', () => {
    const { style, dropped } = compatNativeStyle({ zIndex: '$sticky' })
    expect(style.zIndex).toBe(zIndexes.sticky)
    expect(dropped).toEqual([])
  })

  it('resolves zIndex="$modal" to the modal layer number', () => {
    expect(styleOf({ zIndex: '$modal' })['zIndex']).toBe(zIndexes.modal)
  })

  it('passes a raw layer number through unchanged', () => {
    expect(styleOf({ zIndex: 3 })['zIndex']).toBe(3)
  })

  it('resolves every token in the map to the exact number the web leg emits', () => {
    for (const token of getKeys(Z_INDEX_TOKEN)) {
      const { style, dropped } = compatNativeStyle({ zIndex: token })
      expect(style.zIndex).toBe(Number(zIndexValue(token)))
      expect(typeof style.zIndex).toBe('number')
      expect(dropped).toEqual([])
    }
  })

  it('drops an unknown token instead of forwarding the raw string', () => {
    const props = offMap({ zIndex: '$zonk' })
    expect(Object.hasOwn(styleOf(props), 'zIndex')).toBe(false)
    expect(droppedOf(props)).toContain('zIndex')
  })
})

describe('the implicit border colour respects per-side colours (INFRA-3775)', () => {
  it('a side with an explicit colour and width never gets the implicit black', () => {
    const style = styleOf({ borderTopWidth: 1, borderTopColor: '#112233' })
    expect(style['borderTopColor']).toBe('#112233')
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
    expect(Object.hasOwn(style, 'borderBottomColor')).toBe(false)
  })

  it('a dropped per-side `$` colour still keeps the implicit black off its side', () => {
    // The token itself stays dropped-and-reported (INFRA-3339): this lane cannot
    // carry it, but the author DID declare a colour, so the divider must not
    // harden into an explicit black stamped over whatever lane carries it.
    const result = compatNativeStyle(offMap({ borderTopWidth: 1, borderTopColor: '$surface3' }))
    const style = result.style as Record<string, unknown>
    expect(result.dropped).toContain('borderTopColor')
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
    expect(Object.hasOwn(style, 'borderTopColor')).toBe(false)
  })

  it('width-painting sides the author left colourless keep the legacy black, per side', () => {
    const style = styleOf({ borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: '#112233' })
    expect(style['borderTopColor']).toBe('#112233')
    expect(style['borderBottomColor']).toBe('#000000')
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
  })

  it('a shorthand width with one per-side colour blackens only the other sides', () => {
    const style = styleOf({ borderWidth: 1, borderTopColor: '#112233' })
    expect(style['borderTopColor']).toBe('#112233')
    expect(style['borderBottomColor']).toBe('#000000')
    expect(style['borderLeftColor']).toBe('#000000')
    expect(style['borderRightColor']).toBe('#000000')
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
  })

  it('a LOGICAL colour spelling counts as authored: no blanket black, its flanks never blackened', () => {
    // `borderStartColor` can resolve to either flank depending on writing
    // direction, so neither left nor right may be blackened; top/bottom keep
    // the per-side legacy black.
    const style = styleOf(offMap({ borderWidth: 1, borderStartColor: '#556677' }))
    expect(style['borderStartColor']).toBe('#556677')
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
    expect(Object.hasOwn(style, 'borderLeftColor')).toBe(false)
    expect(Object.hasOwn(style, 'borderRightColor')).toBe(false)
    expect(style['borderTopColor']).toBe('#000000')
    expect(style['borderBottomColor']).toBe('#000000')
  })

  it('block colour spellings cover their vertical sides', () => {
    const style = styleOf(offMap({ borderWidth: 1, borderBlockStartColor: '#667788' }))
    expect(style['borderBlockStartColor']).toBe('#667788')
    expect(Object.hasOwn(style, 'borderTopColor')).toBe(false)
    expect(style['borderBottomColor']).toBe('#000000')
    expect(style['borderLeftColor']).toBe('#000000')
    expect(style['borderRightColor']).toBe('#000000')
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
  })

  it('mixed physical + logical authored colours never receive injected physical black', () => {
    const style = styleOf(offMap({ borderWidth: 1, borderTopColor: '#112233', borderEndColor: '#223344' }))
    expect(style['borderTopColor']).toBe('#112233')
    expect(style['borderEndColor']).toBe('#223344')
    expect(Object.hasOwn(style, 'borderLeftColor')).toBe(false)
    expect(Object.hasOwn(style, 'borderRightColor')).toBe(false)
    expect(style['borderBottomColor']).toBe('#000000')
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
  })

  it('width only (no colour props at all) keeps the legacy shorthand black', () => {
    const style = styleOf({ borderTopWidth: 1 })
    expect(style['borderColor']).toBe('#000000')
    expect(Object.hasOwn(style, 'borderTopColor')).toBe(false)
  })

  it('an explicit shorthand colour is unchanged and suppresses every injection', () => {
    const style = styleOf({ borderWidth: 1, borderColor: '#334455', borderTopColor: '#112233' })
    expect(style['borderColor']).toBe('#334455')
    expect(style['borderTopColor']).toBe('#112233')
    expect(Object.hasOwn(style, 'borderBottomColor')).toBe(false)
  })
})

describe('physical border width tokens resolve through SPACE_TOKEN_PX (INFRA-3272)', () => {
  it('resolves borderWidth="$spacing1" to 1 and still declares the implicit border color', () => {
    const { style, dropped } = compatNativeStyle({ borderWidth: '$spacing1' })
    expect(style.borderWidth).toBe(1)
    expect(style.borderColor).toBe('#000000')
    expect(dropped).toEqual([])
  })

  it('resolves borderWidth="$none" to 0, byte-identical to borderWidth={0} on the web leg', () => {
    expect(styleOf({ borderWidth: '$none' })['borderWidth']).toBe(0)
  })

  it('resolves the physical longhands and passes raw numbers through', () => {
    expect(
      styleOf({ borderTopWidth: '$spacing2', borderBottomWidth: 3, borderLeftWidth: '$spacing1', borderRightWidth: 0 }),
    ).toMatchObject({ borderTopWidth: 2, borderBottomWidth: 3, borderLeftWidth: 1, borderRightWidth: 0 })
  })

  it('resolves every space token to the exact px number the web leg emits', () => {
    for (const token of getKeys(SPACE_TOKEN_PX)) {
      const width = styleOf({ borderWidth: token })['borderWidth']
      expect(width).toBe(Number.parseFloat(borderWidthPx(token)))
      expect(typeof width).toBe('number')
    }
  })

  it('drops an unknown token and does NOT declare the implicit border color for it', () => {
    const props = offMap({ borderWidth: '$zonk' })
    const style = styleOf(props)
    expect(Object.hasOwn(style, 'borderWidth')).toBe(false)
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
    expect(droppedOf(props)).toContain('borderWidth')
  })
})

describe('shadow geometry tokens resolve through SPACE_TOKEN_PX (INFRA-3272)', () => {
  it('resolves shadowRadius="$spacing8" to 8 and passes raw numbers through', () => {
    expect(styleOf({ shadowRadius: '$spacing8' })['shadowRadius']).toBe(8)
    expect(styleOf({ shadowRadius: 6 })['shadowRadius']).toBe(6)
  })

  it('resolves both shadowOffset axes', () => {
    expect(styleOf({ shadowOffset: { width: '$spacing2', height: '$spacing4' } })['shadowOffset']).toEqual({
      width: 2,
      height: 4,
    })
  })

  it('drops shadowRadius and shadowOffset on unknown tokens instead of forwarding raw strings', () => {
    const props = offMap({ shadowRadius: '$zonk', shadowOffset: { width: '$zonk', height: 2 } })
    const style = styleOf(props)
    expect(Object.hasOwn(style, 'shadowRadius')).toBe(false)
    expect(Object.hasOwn(style, 'shadowOffset')).toBe(false)
    expect(droppedOf(props)).toEqual(expect.arrayContaining(['shadowRadius', 'shadowOffset']))
  })
})

describe('x/y translate tokens resolve before the RN transform array (INFRA-3272)', () => {
  it('resolves x="$spacing8" into a numeric translateX entry', () => {
    const { style, dropped } = compatNativeStyle({ x: '$spacing8', y: 2 })
    expect(style.transform).toEqual([{ translateY: 2 }, { translateX: 8 }])
    expect(dropped).toEqual([])
  })

  it('drops an unknown x token and keeps the resolvable entries', () => {
    const props = offMap({ x: '$zonk', y: 2 })
    expect(styleOf(props)['transform']).toEqual([{ translateY: 2 }])
    expect(droppedOf(props)).toContain('x')
  })

  it('emits no transform at all when the only entry is unresolvable', () => {
    const props = offMap({ x: '$zonk' })
    expect(Object.hasOwn(styleOf(props), 'transform')).toBe(false)
    expect(droppedOf(props)).toContain('x')
  })
})

describe('the numeric-token surface never leaks a raw token string (INFRA-3272)', () => {
  it('holds across the whole surface in one style object', () => {
    const { style, dropped } = compatNativeStyle({
      zIndex: '$sticky',
      borderWidth: '$spacing1',
      borderTopWidth: '$spacing2',
      shadowRadius: '$spacing8',
      shadowOffset: { width: '$none', height: '$spacing4' },
      x: '$spacing12',
      y: '$spacing16',
    })
    expect(dropped).toEqual([])
    const flat = Object.values(style).flatMap((value) =>
      typeof value === 'object' && value !== null ? Object.values(value) : [value],
    )
    for (const value of flat) {
      if (typeof value === 'string') {
        expect(value.startsWith('$')).toBe(false)
      }
    }
  })
})

describe('non-token legacy value family on the native lane (INFRA-3258)', () => {
  const variable = (val: string | number): { isVar: true; val: string | number; name: string; key: string } => ({
    isVar: true,
    val,
    name: 'test',
    key: 'test',
  })

  it('unwraps a Variable to its val on every builder, byte-identical to passing the val', () => {
    expect(styleOf({ width: variable(100) })['width']).toBe(100)
    expect(styleOf({ padding: variable(8) })['padding']).toBe(8)
    expect(styleOf({ top: variable('50%') })['top']).toBe('50%')
    expect(styleOf({ zIndex: variable(40) })['zIndex']).toBe(40)
    expect(styleOf({ borderRadius: variable(12) })['borderRadius']).toBe(12)
    expect(styleOf({ borderWidth: variable(2) })['borderWidth']).toBe(2)
    expect(styleOf({ backgroundColor: variable('#112233') })['backgroundColor']).toBe('#112233')
    expect(styleOf({ marginStart: variable(12) })['marginStart']).toBe(12)
  })

  it('a Variable never reaches the RN style object as an object', () => {
    const { style } = compatNativeStyle({ width: variable(100), backgroundColor: variable('#112233') })
    for (const value of Object.values(style)) {
      expect(typeof value === 'object' && value !== null && 'isVar' in value).toBe(false)
    }
  })

  it('drops-and-reports the web-only members of the family (no RN expression)', () => {
    for (const [prop, value] of [
      ['padding', 'calc(100% - 8px)'],
      ['top', '10vh'],
      ['borderWidth', 'unset'],
      ['zIndex', 'var(--layer)'],
      ['borderRadius', 'inherit'],
    ] as const) {
      const props = { [prop]: value } as LaneProps
      expect(droppedOf(props), prop).toContain(prop)
      expect(Object.hasOwn(styleOf(props), prop), prop).toBe(false)
    }
  })

  it('keeps the RN-expressible members landing (percentages, auto)', () => {
    expect(styleOf({ padding: '50%' })['padding']).toBe('50%')
    expect(styleOf({ margin: 'auto' })['margin']).toBe('auto')
  })
})
