/**
 * INFRA-3230: pins the platform-leg contract of ButtonCompat's three-file split
 * — a platformless base stub that throws, the real `.web.tsx` implementation,
 * and the `.native.tsx` React Native leg.
 *
 * The split is required by `dangerfile.ts` `checkSplitFiles()`, which fails any
 * touched `.native.tsx` lacking a `.web.tsx` sibling or a base stub.
 *
 * All three legs must expose the same symbol set, including the `Object.assign`
 * shape (`.Text` / `.Icon`) and `getContrastTextClass`, so no bundler
 * resolution can land on a missing export.
 *
 * Template: ../floating-overlay/platform-legs.test.ts, including its documented
 * gotcha — the mycelium vitest config resolves `.web.*` first, so the base leg
 * has to be imported with an explicit extension or the resolver silently swaps
 * it for the web leg.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { act, create } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import { __resetNativeStyleWarnings } from '../compat/native-diagnostics'
// Explicit .tsx extension — see the header note.
import * as base from './ButtonCompat.tsx'
import * as web from './ButtonCompat.web'

vi.mock('react-native', () => import('./testing/native-mocks'))
vi.mock('react-native-gesture-handler', () => import('./testing/gesture-handler-mock'))
vi.mock('react-native-reanimated', () => import('./testing/reanimated-mock'))
// Both of these resolve to untranspiled sources under the jsdom config (RN Flow
// / uniwind TypeScript), and importing the native leg alone is enough to trip
// them. The real modules only run on device.
vi.mock('react-native-svg', () => import('./testing/react-native-svg-mock'))
vi.mock('uniwind', () => import('./testing/uniwind-mock'))

// react-test-renderer's act() needs the explicit opt-in (the
// ../flex-compat/platform-legs.test.ts precedent).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('export parity across the ButtonCompat platform legs', () => {
  it('all three legs export the same symbols', async () => {
    const native = await import('./ButtonCompat.native')
    const baseKeys = Object.keys(base).sort()
    expect(Object.keys(web).sort()).toEqual(baseKeys)
    expect(Object.keys(native).sort()).toEqual(baseKeys)
  })

  it('the implementation legs export a forwardRef ButtonCompat and a callable getContrastTextClass', async () => {
    const native = await import('./ButtonCompat.native')
    for (const leg of [web, native]) {
      // Object.assign over forwardRef(...) — an exotic component object, not a
      // plain function, on both implementation legs.
      expect((leg.ButtonCompat as unknown as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.forward_ref'))
      expect(typeof leg.getContrastTextClass).toBe('function')
    }
  })

  it('every leg carries the Object.assign static shape (.Text / .Icon)', async () => {
    const native = await import('./ButtonCompat.native')
    for (const leg of [base, web, native]) {
      expect(typeof leg.ButtonCompat.Text).toBe('function')
      expect(typeof leg.ButtonCompat.Icon).toBe('function')
    }
  })

  it('getContrastTextClass agrees across legs (it is the shared ./compile implementation)', async () => {
    const native = await import('./ButtonCompat.native')
    for (const color of ['#ffffff', '#000000', '#fa2', 'rgb(10, 20, 30)', 'not-a-color']) {
      expect(native.getContrastTextClass(color)).toBe(base.getContrastTextClass(color))
      expect(web.getContrastTextClass(color)).toBe(base.getContrastTextClass(color))
    }
  })
})

describe('base leg (platformless stub)', () => {
  it('rendering ButtonCompat throws the platform-override error', () => {
    // Reaching the base leg means the bundler's platform extension order did
    // not resolve — it must fail loudly rather than render an empty button.
    expect(() => renderToStaticMarkup(<base.ButtonCompat>Swap</base.ButtonCompat>)).toThrowError(
      'ButtonCompat not implemented. Did you forget a platform override?',
    )
  })

  it.each([
    ['ButtonCompat.Text', base.ButtonCompat.Text],
    ['ButtonCompat.Icon', base.ButtonCompat.Icon],
  ])('%s throws the platform-override error', (name, Component) => {
    expect(() => Component({})).toThrowError(`${name} not implemented. Did you forget a platform override?`)
  })
})

describe('web leg (the real implementation apps/web resolves)', () => {
  it('renders a real button element', () => {
    const markup = renderToStaticMarkup(<web.ButtonCompat>Swap</web.ButtonCompat>)
    expect(markup).toContain('<button')
    expect(markup).toContain('Swap')
  })
})

// INFRA-3478 (review rounds): the web-only props must never be SILENT on the
// native leg. The link form (`tag`/`href`/`target`/`rel`) stays inert — this
// leg mounts a Pressable, never an anchor, exactly as on legacy where
// Tamagui's `tag` override is a web-only concept — so it must render without
// effect rather than throw, AND dev-warn the drop (round 3): a converted call
// site otherwise loses its navigation with no signal. The layout lane
// (height/justifyContent) has no native handling either, so the leg
// dev-warns it like every other dropped prop in this package. Same doctrine
// for the INFRA-3240 responsive media pools ($sm/$md/…): no native media
// handling, so a set pool renders without effect AND dev-warns the drop
// (via the shared dead-prop ledger, ../compat/native-diagnostics).
describe('native leg (the RN implementation Metro resolves)', () => {
  async function renderNative(props: Record<string, unknown>): Promise<void> {
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    act(() => {
      create(createElement(NativeButtonCompat, props as never, 'Swap'))
    })
  }

  it('renders the link form (tag="a" + href/target/rel) without throwing AND dev-warns each dropped link prop', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await expect(
      renderNative({ tag: 'a', href: 'https://app.uniswap.org', target: '_blank', rel: 'noreferrer' }),
    ).resolves.toBeUndefined()
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    for (const prop of ['tag', 'href', 'target', 'rel']) {
      expect(warned, prop).toContain(`"${prop}"`)
    }
    warn.mockRestore()
  })

  it('renders $sm/$md without throwing AND dev-warns each dropped media pool', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await expect(renderNative({ $sm: { minWidth: '$spacing36' }, $md: { maxWidth: 200 } })).resolves.toBeUndefined()
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    for (const prop of ['$sm', '$md']) {
      expect(warned, prop).toContain(`"${prop}"`)
    }
    warn.mockRestore()
  })

  // The link-form warn is gated on the link form being REQUESTED (tag="a"):
  // an explicit tag="button" is the ordinary button form on both platforms,
  // and href/target/rel without tag="a" are ignored by the web leg's button
  // path just the same — no cross-platform divergence, so no warning.
  it('does not dev-warn an explicit tag="button"', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ tag: 'button' })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    warn.mockRestore()
  })

  it('does not dev-warn link props passed without tag="a" (the web button path drops them too)', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ href: '/x', target: '_blank', rel: 'noreferrer' })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    warn.mockRestore()
  })

  // INFRA-3240 review: `focusScaling` and `primary-color` are accepted-and-inert
  // on BOTH platforms — legacy native ignores them identically (the parity
  // matrix's focusScaling section pins accepted-and-inert), so there is no
  // divergence to warn about, exactly like tag="button". They ride the
  // `...unhandled` rest into `nativeWarningProps`, whose fixed dead-key ledger
  // does not list them — this pin keeps a future ledger edit from changing that.
  it('does not dev-warn the inert-parity props (focusScaling, primary-color)', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ focusScaling: 'equal:smaller-button', 'primary-color': '#fc72ff' })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    warn.mockRestore()
  })

  // INFRA-3541: `$platform-web` is inert-parity too — legacy Tamagui ignores the
  // pool on device just the same (the rationale lives on
  // ButtonCompatPlatformWebStyleProps in ./dimensions), so console.warn must
  // never fire for it. Unlike focusScaling it does NOT ride the `...unhandled`
  // rest: the leg destructures it out explicitly, and this pin fails if a future
  // edit reorders that destructure or routes the pool through the dev-warn ledger.
  it('does not dev-warn the inert $platform-web pool — parity, never a drop', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ '$platform-web': { textDecoration: 'none', alignSelf: 'flex-start' } })
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('dev-warns that height/justifyContent are dropped — never silent', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ height: '$spacing36', justifyContent: 'flex-start' })
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    for (const prop of ['height', 'justifyContent']) {
      expect(warned, prop).toContain(`"${prop}"`)
    }
    warn.mockRestore()
  })

  // INFRA-3750: `width` moved OUT of the web-only exclusion set — its native
  // call sites (EarnVaultOverview.tsx, TokenDetailsEarnSection.tsx) need it to
  // actually render, not just typecheck: the resolved value has to reach the
  // SAME native style lane gap/p ride, and it must never dev-warn anymore.
  it('paints width through the native style lane and never dev-warns it', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { width: '100%' } as never, 'Swap'))
    })
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"width":"100%"')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  // INFRA-3541: alignSelf is web-only too (the driving call site is the Auctions
  // discovery see-all CTA, a link-form anchor this leg never mounts), so like
  // height the leg accepts and dev-warns it rather than wiring the style.
  it('dev-warns that alignSelf is dropped — never silent', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ alignSelf: 'flex-start' })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain('"alignSelf"')
    warn.mockRestore()
  })

  // The SwapFormDecimalPad preset pills pass `borderRadius="$roundedFull"` on native.
  it('paints borderRadius through the native lanes and never dev-warns it', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { borderRadius: '$roundedFull' } as never, 'Max'))
    })
    const frame = rendered?.toJSON() as { props?: { className?: string; style?: unknown } } | null
    expect(frame?.props?.className?.split(' ')).toContain('rounded-[999999px]')
    expect(JSON.stringify(frame?.props?.style ?? null)).toContain('"borderRadius":999999')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  // INFRA-3603: flexBasis is web-only (its call sites are DappRequestContent
  // and QueuedOrderModal's isWebPlatform guard), so like height the native leg
  // accepts and dev-warns it rather than wiring the style. Without the fix it
  // falls into the `...unhandled` rest, which nativeWarningProps does NOT
  // list — so it would drop in silence and this test (asserting the warn)
  // fails red.
  it('dev-warns that flexBasis is dropped — never silent', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ flexBasis: 1 })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain('"flexBasis"')
    warn.mockRestore()
  })

  // flexBasis is NOT wired through the native style lane (unlike gap/p): the
  // resolved value must never appear on the rendered frame style. `flex`
  // moved OUT of this set in INFRA-3750 (see the next test).
  it('does not paint flexBasis onto the native style lane', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { flexBasis: 1 } as never, 'Swap'))
    })
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).not.toContain('flexBasis')
    warn.mockRestore()
  })

  // INFRA-3750: `flex` moved OUT of the web-only exclusion set — its native
  // call sites (EarnVaultOverview.tsx, NetworkCostEditor.tsx) need the
  // longhand pair to actually paint, not just typecheck: never dev-warned,
  // and resolves through the SAME native style lane gap/p already ride.
  it('paints flex through the native style lane and never dev-warns it', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { flex: 1 } as never, 'Swap'))
    })
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"flexGrow":1')
    expect(style).toContain('"flexShrink":1')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  // `opacity` cannot ride the class lane alone: `opacity-[0.4]` is interpolated
  // from a runtime value, which uniwind's static scanner never sees, so the
  // resolved number has to be declared through the style lane or the view-only
  // dimming stops painting in silence.
  it('paints opacity through the native style lane and never dev-warns it', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { opacity: 0.4 } as never, 'Swap'))
    })
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"opacity":0.4')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('emits no ButtonCompat warning when none of the dropped layout or media props are set', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({})
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    warn.mockRestore()
  })

  // INFRA-3472: gap/p/padding are WIRED on this leg (unlike height) —
  // the resolved values ride the style lane, so they must never dev-warn.
  it('applies gap and p through the native style lane and never dev-warns them', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { gap: '$spacing6', p: 0 } as never, 'Swap'))
    })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"gap":6')
    expect(style).toContain('"padding":0')
    warn.mockRestore()
  })

  it('the p shorthand wins over the padding longhand on the native style lane too', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { padding: '$spacing8', p: 0 } as never, 'Swap'))
    })
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"padding":0')
    expect(style).not.toContain('"padding":8')
    warn.mockRestore()
  })

  // RN can't parse a `$` string, so a raw token in `style` painted nothing
  // (ErrorBoundary's `$neutral1` Restart, BridgeTokenButton's `$accent1`).
  it('resolves a token backgroundColor through classes, never a raw $ string in style', async () => {
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { backgroundColor: '$accent1' } as never, 'Bridge'))
    })
    const frame = rendered?.toJSON() as { props?: { className?: string; style?: unknown } } | null
    const classes = frame?.props?.className?.split(' ')
    expect(classes).toContain('bg-accent1')
    expect(classes).toContain('border-accent1')
    expect(JSON.stringify(frame?.props?.style ?? null)).not.toContain('$accent1')
  })

  // A pooled-only borderColor must NOT withhold the native custom-bg border:
  // the media pools are inert on this leg (dev-warned, never painted), so the
  // derived border is the only border colour that can paint here. The web leg
  // withholds in the same shape via its lane check (see ./web-custom-style).
  it('keeps the custom-bg border when only a media pool sets borderColor (pools are inert here)', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(
        createElement(
          NativeButtonCompat,
          { backgroundColor: '#fa2', $md: { borderColor: '$neutral3' } } as never,
          'Swap',
        ),
      )
    })
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"borderColor":"#fa2"')
    warn.mockRestore()
  })

  it('the padding longhand alone lands on the native style lane and never dev-warns', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { padding: '$spacing8' } as never, 'Swap'))
    })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"padding":8')
    warn.mockRestore()
  })

  // INFRA-3550: the group anchor is a web-only marker class (uniwind drops the
  // group-* variants it anchors), so like height the native leg accepts it and
  // dev-warns the drop rather than rendering a dead anchor in silence.
  it('dev-warns that group is dropped — never silent', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await renderNative({ group: true })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain('"group"')
    warn.mockRestore()
  })

  // INFRA-3550: the styled Button.Text surface is web-rendered; the native leg
  // wires `variant` (it only re-picks the cell), `color` and `fontSize`, treats
  // `animation` as inert like every leg, and dev-warns each style prop it drops.
  it('Button.Text dev-warns the dropped styled props, but never the wired ones or animation', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    act(() => {
      create(
        createElement(
          NativeButtonCompat,
          {} as never,
          createElement(
            NativeButtonCompat.Text,
            {
              variant: 'critical',
              animation: 'fastHeavy',
              color: '$neutral2',
              fontSize: 14,
              opacity: 0.5,
              position: 'relative',
              top: 0,
              whiteSpace: 'nowrap',
              transition: 'top 120ms',
              '$group-hover': { top: -6 },
            } as never,
            'Verify',
          ),
        ),
      )
    })
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    for (const prop of ['opacity', 'position', 'top', 'whiteSpace', 'transition', '$group-hover']) {
      expect(warned, prop).toContain(`"${prop}"`)
    }
    expect(warned).toContain('ButtonCompat.Text')
    for (const prop of ['variant', 'color', 'fontSize', 'animation']) {
      expect(warned, prop).not.toContain(`"${prop}"`)
    }
    warn.mockRestore()
  })

  // A hex/rgb `color` and `fontSize` paint through the label's style (the token
  // half resolves through uniwind, which the jsdom mock can't — see
  // text-props.test.ts for its split).
  it('Button.Text paints a hex color and fontSize, and the hex yields to the disabled palette', async () => {
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    const renderLabelStyle = (disabled: boolean): string => {
      let rendered: ReturnType<typeof create> | undefined
      act(() => {
        rendered = create(
          createElement(
            NativeButtonCompat,
            { disabled } as never,
            createElement(NativeButtonCompat.Text, { color: '#FF00AA', fontSize: 14 } as never, 'Verify'),
          ),
        )
      })
      const [label] =
        rendered?.root.findAll((node) => node.props['children'] === 'Verify' && node.props['style'] !== undefined) ?? []
      return JSON.stringify(label?.props['style'] ?? null)
    }
    expect(renderLabelStyle(false)).toContain('"color":"#FF00AA"')
    expect(renderLabelStyle(false)).toContain('"fontSize":14')
    expect(renderLabelStyle(true)).not.toContain('#FF00AA')
    expect(renderLabelStyle(true)).toContain('"fontSize":14')
  })

  // INFRA-3661: the margin family is WIRED on this leg like gap/p — the
  // resolved values ride the style lane (applySpacing, where the side key
  // beats the axis key beats `margin`, RN's own edge precedence), so they
  // must never dev-warn. Without the wiring they fall into the `...unhandled`
  // rest and paint nothing, which the style assertions here catch red.
  it('applies margins through the native style lane and never dev-warns them', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { mt: '$spacing8', mx: 'auto', mb: 0 } as never, 'Swap'))
    })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"marginTop":8')
    expect(style).toContain('"marginHorizontal":"auto"')
    expect(style).toContain('"marginBottom":0')
    warn.mockRestore()
  })

  it('the margin shorthand wins over the longhand spelling on the native style lane too', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { marginTop: '$spacing8', mt: 0 } as never, 'Swap'))
    })
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"marginTop":0')
    expect(style).not.toContain('"marginTop":8')
    warn.mockRestore()
  })

  // The shorthand-beside-longhand cases above pass whether or not the longhand
  // spelling resolves on its own; alone, it must land on the style lane itself
  // — and un-warned, because it is wired (the padding-longhand precedent).
  it('the margin longhand spelling alone lands on the native style lane and never dev-warns', async () => {
    __resetNativeStyleWarnings()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { ButtonCompat: NativeButtonCompat } = await import('./ButtonCompat.native')
    let rendered: ReturnType<typeof create> | undefined
    act(() => {
      rendered = create(createElement(NativeButtonCompat, { marginTop: '$spacing8' } as never, 'Swap'))
    })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('ButtonCompat')
    const frame = rendered?.toJSON() as { props?: { style?: unknown } } | null
    const style = JSON.stringify(frame?.props?.style ?? null)
    expect(style).toContain('"marginTop":8')
    warn.mockRestore()
  })
})
