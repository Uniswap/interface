/**
 * Compat `style` prop contract (INFRA-3509): consumer APIs typed with an RN
 * `StyleProp<ViewStyle>` (or the wider `StyleProp<ViewStyle | CSSProperties |
 * ...>` union the held call sites actually carry) must be accepted by the
 * compat primitives without casts. The type pins compile in this package's
 * tsc program, so a re-narrowed `style` fails
 * `mycelium:typecheck`, not just vitest. Runtime legs pin the web flatten
 * (StyleSheet.flatten semantics) end-to-end through rendered FlexCompat
 * (the `mergeCompatStyle` path in `dom.tsx`) and TextCompat (the one leg
 * that merges an anchor inline color of its own before the frame); native
 * legs pass the value into the RN style array verbatim, so they need no
 * conversion. The last suite pins the widening's other silent-drop
 * direction: RN-only style keys that CSS cannot render must dev-warn.
 */
import type * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { FlexStyle, StyleProp, TextStyle, ViewStyle } from 'react-native'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FlexCompat } from '../flex-compat/FlexCompat.web'
import type { FlexCompatProps } from '../flex-compat/props'
import type { TextCompatProps } from '../text-compat/props'
import { TextCompat } from '../text-compat/TextCompat.web'
import type { TouchableAreaCompatProps } from '../touchable-area/props'
import type { ViewCompatProps } from '../view-compat/props'
import { flattenCompatStyle, mergeCompatStyle } from './compose'
import type { CompatStyleProp } from './props'
import { __resetWebStyleWarnings } from './web-diagnostics'

/**
 * The exact prop shape of the held call sites: ActivityListEmptyState /
 * NftsListEmptyState (`containerStyle`) and HandleBar (`containerFlexStyles`).
 */
type ResidualConsumerStyle = StyleProp<ViewStyle | React.CSSProperties | (ViewStyle & React.CSSProperties)>

/** Value-level pins with full assignability diagnostics; referenced by the suite, never invoked. */
function styleAssignabilityPins(
  rnStyle: StyleProp<ViewStyle>,
  residualStyle: ResidualConsumerStyle,
  flexStyle: FlexStyle,
  textStyle: StyleProp<TextStyle>,
  cssStyle: React.CSSProperties,
): void {
  const rnIntoFlex: FlexCompatProps['style'] = rnStyle
  const residualIntoFlex: FlexCompatProps['style'] = residualStyle
  const flexStyleIntoFlex: FlexCompatProps['style'] = flexStyle
  const textStyleIntoText: TextCompatProps['style'] = textStyle
  const rnIntoTouchable: TouchableAreaCompatProps['style'] = rnStyle
  const cssIntoView: ViewCompatProps['style'] = cssStyle
  // @ts-expect-error the union stays closed to style objects/arrays — a bare
  // color string must keep failing, like it did against CSSProperties
  const stringRejected: CompatStyleProp = 'red'
  void rnIntoFlex
  void residualIntoFlex
  void flexStyleIntoFlex
  void textStyleIntoText
  void rnIntoTouchable
  void cssIntoView
  void stringRejected
}

describe('compat style prop accepts RN StyleProp shapes (INFRA-3509)', () => {
  it('carries the compile-time pins', () => {
    expect(typeof styleAssignabilityPins).toBe('function')
  })

  it('flattens arrays depth-first with later entries winning, skipping falsy entries', () => {
    expect(
      flattenCompatStyle([
        { marginTop: 4, marginLeft: 2 },
        false,
        null,
        undefined,
        [{ marginTop: 8 }, [{ paddingBottom: 1 }]],
      ]),
    ).toEqual({ marginTop: 8, marginLeft: 2, paddingBottom: 1 })
  })

  it('passes a plain object through unchanged', () => {
    const style = { marginTop: 4 }
    expect(flattenCompatStyle(style)).toBe(style)
  })

  it('returns undefined for falsy and entry-less forms', () => {
    expect(flattenCompatStyle(undefined)).toBeUndefined()
    expect(flattenCompatStyle(null)).toBeUndefined()
    expect(flattenCompatStyle(false)).toBeUndefined()
    expect(flattenCompatStyle([])).toBeUndefined()
    expect(flattenCompatStyle([false, undefined, null])).toBeUndefined()
  })

  it('drops RegisteredStyle ids — a stylesheet id cannot be resolved on web', () => {
    // The drop is the walker's; the SIGNAL lives at the web seams — see the
    // RegisteredStyle cases in the dev-warn suite below.
    const registeredId = 7 as unknown as CompatStyleProp
    expect(flattenCompatStyle(registeredId)).toBeUndefined()
    expect(flattenCompatStyle([registeredId, { marginTop: 4 }])).toEqual({ marginTop: 4 })
  })

  it('mergeCompatStyle flattens the caller side and keeps caller-wins ordering', () => {
    expect(mergeCompatStyle({ marginTop: 1, opacity: 0.5 }, [{ marginTop: 9 }, false])).toEqual({
      marginTop: 9,
      opacity: 0.5,
    })
    expect(mergeCompatStyle({ marginTop: 1 }, [false, undefined])).toEqual({ marginTop: 1 })
    expect(mergeCompatStyle(undefined, [{ marginTop: 2 }])).toEqual({ marginTop: 2 })
  })

  it('renders an RN-array style flattened onto the web leg style attribute', () => {
    const markup = renderToStaticMarkup(
      <FlexCompat style={[{ marginTop: 4 }, false, undefined, [{ marginTop: 8, marginLeft: 2 }]]} />,
    )
    const style = /\sstyle="([^"]*)"/.exec(markup)?.[1] ?? ''
    expect(style).toContain('margin-top:8px')
    expect(style).toContain('margin-left:2px')
    expect(style).not.toContain('margin-top:4px')
  })

  it('renders an RN-array style flattened through TextCompat, the leg that merges its own anchor color', () => {
    const markup = renderToStaticMarkup(
      <TextCompat style={[{ marginTop: 4 }, false, undefined, [{ marginTop: 8, marginLeft: 2 }]]}>text</TextCompat>,
    )
    const style = /\sstyle="([^"]*)"/.exec(markup)?.[1] ?? ''
    expect(style).toContain('margin-top:8px')
    expect(style).toContain('margin-left:2px')
    expect(style).not.toContain('margin-top:4px')
  })

  it('keeps an ARRAY caller style winning over the TextCompat anchor inline color', () => {
    const markup = renderToStaticMarkup(
      <TextCompat tag="a" href="https://example.com" color="$neutral1" style={[{ color: 'red' }]}>
        link
      </TextCompat>,
    )
    const style = /\sstyle="([^"]*)"/.exec(markup)?.[1] ?? ''
    expect(style).toContain('color:red')
    expect(style).not.toContain('color:var(--stext-neutral1)')
  })
})

describe('RN-only style keys dev-warn on the web merge path (INFRA-3509 review round 1)', () => {
  beforeEach(() => {
    __resetWebStyleWarnings()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns once per RN-only key, across flattened arrays, and stays silent for CSS keys', () => {
    // No casts: the widened union really typechecks these on a web merge —
    // that admission is exactly why the warning exists.
    mergeCompatStyle(undefined, [{ elevation: 4 }, { marginHorizontal: 8, marginTop: 2 }])
    mergeCompatStyle(undefined, { elevation: 2 })
    const warned = vi.mocked(console.warn).mock.calls.map((call) => String(call[0]))
    expect(warned).toHaveLength(2)
    expect(warned[0]).toContain('"elevation"')
    expect(warned[1]).toContain('"marginHorizontal"')
    expect(warned.join('\n')).not.toContain('marginTop')
  })

  it('stays silent for an RN-only key carrying an explicit undefined — it would never have rendered', () => {
    mergeCompatStyle(undefined, { elevation: undefined, transform: undefined })
    mergeCompatStyle(undefined, [{ marginHorizontal: undefined }, { marginTop: 2 }])
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('warns for RN array-form transform but not for a CSS transform string', () => {
    mergeCompatStyle(undefined, { transform: 'translateX(2px)' })
    expect(console.warn).not.toHaveBeenCalled()
    mergeCompatStyle(undefined, { transform: [{ translateX: 2 }] })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"transform"')
  })

  it('warns for RN array-form boxShadow but not for a CSS boxShadow string', () => {
    mergeCompatStyle(undefined, { boxShadow: '0 2px 4px #0003' })
    expect(console.warn).not.toHaveBeenCalled()
    mergeCompatStyle(undefined, { boxShadow: [{ offsetX: 0, offsetY: 2, blurRadius: 4, color: '#0003' }] })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"boxShadow"')
  })

  it('warns for RN array-form filter but not for a CSS filter string', () => {
    mergeCompatStyle(undefined, { filter: 'blur(4px)' })
    expect(console.warn).not.toHaveBeenCalled()
    mergeCompatStyle(undefined, { filter: [{ blur: 4 }] })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"filter"')
  })

  it('warns for RN array-form transformOrigin but not for a CSS transformOrigin string', () => {
    mergeCompatStyle(undefined, { transformOrigin: '50% 50%' })
    expect(console.warn).not.toHaveBeenCalled()
    mergeCompatStyle(undefined, { transformOrigin: ['50%', '50%', 0] })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"transformOrigin"')
  })

  it('warns for RN array-form fontVariant but not for a CSS fontVariant string', () => {
    mergeCompatStyle(undefined, { fontVariant: 'small-caps' })
    expect(console.warn).not.toHaveBeenCalled()
    // TextStyle-only key: it reaches the merge through consumer APIs typed
    // StyleProp<TextStyle>, which the compat union admits because TextStyle
    // extends ViewStyle — hence the typed binding instead of a fresh literal.
    const textCallerStyle: TextStyle = { fontVariant: ['small-caps', 'tabular-nums'] }
    mergeCompatStyle(undefined, textCallerStyle)
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"fontVariant"')
  })

  it('stays silent for a single-element STRING array — it coerces exactly as the direct value would', () => {
    const textCallerStyle: TextStyle = { fontVariant: ['tabular-nums'] }
    mergeCompatStyle(undefined, textCallerStyle)
    mergeCompatStyle(undefined, { transformOrigin: ['50%'] })
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('still warns for a single-element NUMBER array — it stringifies before React DOM can append px', () => {
    mergeCompatStyle(undefined, { transformOrigin: [50] })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"transformOrigin"')
  })

  it('still warns for a single-element OBJECT array — it coerces to "[object Object]"', () => {
    mergeCompatStyle(undefined, { transform: [{ scale: 2 }] })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"transform"')
  })

  it('warns for an experimental_background* key in its STRING form too — React DOM has no such CSS property', () => {
    mergeCompatStyle(undefined, { experimental_backgroundImage: 'linear-gradient(to bottom, red, blue)' })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('"experimental_backgroundImage"')
  })

  it('fires through a rendered web primitive, not just the bare merge', () => {
    renderToStaticMarkup(<FlexCompat style={{ shadowRadius: 4 }} />)
    expect(
      vi
        .mocked(console.warn)
        .mock.calls.map((call) => String(call[0]))
        .join('\n'),
    ).toContain('"shadowRadius"')
  })

  it('warns when the merge drops a RegisteredStyle id — the platform-neutral walker itself stays silent', () => {
    const registeredId = 7 as unknown as CompatStyleProp
    // The walker is the checkbox NATIVE leg's flatten too, where dropping a
    // number is real StyleSheet.flatten behavior — it must never warn itself.
    expect(flattenCompatStyle([registeredId, { marginTop: 4 }])).toEqual({ marginTop: 4 })
    expect(console.warn).not.toHaveBeenCalled()
    // The web seam warns, without changing the flatten result.
    expect(mergeCompatStyle(undefined, [registeredId, { marginTop: 4 }])).toEqual({ marginTop: 4 })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('RegisteredStyle id (7)')
  })

  it('warns once per distinct RegisteredStyle id, including ids nested in arrays and a bare top-level id', () => {
    const idSeven = 7 as unknown as CompatStyleProp
    const idNine = 9 as unknown as CompatStyleProp
    mergeCompatStyle(undefined, [[{ marginTop: 4 }, idSeven]])
    mergeCompatStyle(undefined, idSeven)
    expect(console.warn).toHaveBeenCalledTimes(1)
    mergeCompatStyle(undefined, idNine)
    expect(console.warn).toHaveBeenCalledTimes(2)
    expect(vi.mocked(console.warn).mock.calls[1]?.[0]).toContain('RegisteredStyle id (9)')
  })

  it('warns for EVERY distinct id in one style array, not just the first, and dedupes on repeat', () => {
    const idSeven = 7 as unknown as CompatStyleProp
    const idNine = 9 as unknown as CompatStyleProp
    mergeCompatStyle(undefined, [idSeven, idNine])
    expect(console.warn).toHaveBeenCalledTimes(2)
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('RegisteredStyle id (7)')
    expect(vi.mocked(console.warn).mock.calls[1]?.[0]).toContain('RegisteredStyle id (9)')
    // Repeat render with the same ids stays silent.
    mergeCompatStyle(undefined, [idSeven, idNine])
    expect(console.warn).toHaveBeenCalledTimes(2)
  })

  it('stays silent for object, array, and falsy styles with no numeric entry', () => {
    mergeCompatStyle(undefined, [{ marginTop: 4 }, false, null, undefined, [{ opacity: 0.5 }]])
    mergeCompatStyle(undefined, { marginTop: 4 })
    mergeCompatStyle(undefined, undefined)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('warns for a dropped RegisteredStyle id through a rendered web primitive', () => {
    renderToStaticMarkup(<FlexCompat style={[7 as unknown as CompatStyleProp, { marginTop: 4 }] as CompatStyleProp} />)
    expect(
      vi
        .mocked(console.warn)
        .mock.calls.map((call) => String(call[0]))
        .join('\n'),
    ).toContain('RegisteredStyle id (7)')
  })
})
