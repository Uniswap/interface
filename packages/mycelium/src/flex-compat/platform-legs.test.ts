/**
 * INFRA-3229: pins the platform-leg contract of FlexCompat.
 *
 * The bug this guards: all three compat primitives funnelled into
 * `compat/dom.tsx` → `React.createElement(tag ?? 'div', …)`, so a converted
 * `apps/mobile` file typechecked, passed the mobile unit suite, passed the
 * native parity harness, and then mounted DOM hosts inside a React Native tree.
 * Every assertion below fails if the native leg is deleted or reverted to the
 * web implementation.
 */
/**
 * SCOPE OF THIS FILE — read before citing it as evidence.
 *
 * This runs under `packages/mycelium/vitest.config.ts`: jsdom, `.web.*` resolved
 * FIRST, and `react-native` replaced by a hand-written stand-in
 * (`../compat/testing/react-native-mock.tsx`). It is therefore an EXPORT-SHAPE and
 * COMPONENT-WIRING pin only — which symbols each leg exports, which host type it
 * mounts, that `tag` is ignored, which props are forwarded, and that the
 * className it attaches is the shared compiler's output byte-for-byte (minus
 * the non-RN display tokens the leg strips).
 *
 * It is NOT native evidence, and must never be presented as such: no uniwind
 * stylesheet is involved, so nothing here says what those classes RESOLVE to on a
 * device. Every hazard this work is about — a `media-*` variant Tailwind discards,
 * a `w-max` uniwind has no map for, a `[display:inline]` that resolves to
 * `display: "flow"` — is invisible at this level.
 *
 * The native evidence for FlexCompat lives in
 * `packages/tailwind/src/parity/flex/native-parity.test.tsx`, which runs under
 * `packages/tailwind/vitest.native.config.ts` (node environment,
 * `TAMAGUI_TARGET=native`, `.native`-first resolution, uniwind's own
 * `compileNativeCSS` pipeline) and asserts on RESOLVED RN style objects.
 */
import { createElement, useEffect } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { groupStatePropKey } from '../compat/group'
import { __resetNativeStyleWarnings } from '../compat/native-diagnostics'
import { PRESS_HANDLER_KEYS } from '../compat/native-props'
import { StyleSheet } from '../compat/testing/react-native-mock'
import { zIndexes } from '../tokens'
import { flexCompatClassName, nativeFlexCompatClassName } from './compile'
// Explicit .tsx extension: the mycelium vitest config resolves `.web.*` first
// (web-first platform splits), which would silently swap the platformless base
// leg for the web leg in this import.
import * as base from './FlexCompat.tsx'
import * as web from './FlexCompat.web'
import type { FlexCompatProps } from './props'

vi.mock('react-native', () => import('../compat/testing/react-native-mock'))

// react-test-renderer's act() needs the explicit opt-in outside jsdom setups.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function nativeLeg(): Promise<typeof import('./FlexCompat.native')> {
  return import('./FlexCompat.native')
}

interface Mounted {
  host: () => ReactTestInstance
  style: () => Record<string, unknown>
  tree: () => ReactTestRenderer
  unmount: () => void
}

async function renderNative(props: FlexCompatProps, children?: unknown): Promise<Mounted> {
  const { FlexCompat } = await nativeLeg()
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(createElement(FlexCompat, props as never, children as never))
  })
  if (renderer === undefined) {
    throw new Error('FlexCompat.native render failed')
  }
  const mounted = renderer
  return {
    host: () => mounted.root.findByType('RNView' as never),
    style: () => StyleSheet.flatten(mounted.root.findByType('RNView' as never).props['style'] as never),
    tree: () => mounted,
    unmount: (): void => {
      act(() => {
        mounted.unmount()
      })
    },
  }
}

beforeEach(() => {
  __resetNativeStyleWarnings()
})

describe('export parity', () => {
  it('base, web and native legs export the same symbols', async () => {
    const native = await nativeLeg()
    const baseKeys = Object.keys(base).sort()
    expect(baseKeys).toEqual(['FlexCompat'])
    expect(Object.keys(web).sort()).toEqual(baseKeys)
    expect(Object.keys(native).sort()).toEqual(baseKeys)
  })

  it('both legs are forwardRef exotic components named FlexCompat', async () => {
    const native = await nativeLeg()
    for (const leg of [web.FlexCompat, native.FlexCompat]) {
      expect(typeof leg).toBe('object')
      expect('render' in leg).toBe(true)
      expect(leg.displayName ?? (leg as unknown as { render: { name: string } }).render.name).toBe('FlexCompat')
    }
  })
})

describe('native leg mounts a React Native host', () => {
  it('renders an RN View, never a DOM element', async () => {
    const mounted = await renderNative({}, 'child')
    expect(mounted.host()).toBeDefined()
    // No DOM host anywhere in the tree — the whole point of the leg.
    for (const tag of ['div', 'span', 'section']) {
      expect(mounted.tree().root.findAllByType(tag as never)).toHaveLength(0)
    }
    mounted.unmount()
  })

  it('ignores `tag` — RN has no tags, and honouring it is the bug', async () => {
    const mounted = await renderNative({ tag: 'section' })
    expect(mounted.host()).toBeDefined()
    expect(mounted.host().props['tag']).toBeUndefined()
    mounted.unmount()
  })

  it('forwards the ref to the native host', async () => {
    const { FlexCompat } = await nativeLeg()
    const received: unknown[] = []
    act(() => {
      create(createElement(FlexCompat, { ref: (node: unknown) => received.push(node) } as never))
    })
    expect(received.length).toBeGreaterThan(0)
  })
})

describe('className identity with the web leg', () => {
  const CASES: FlexCompatProps[] = [
    {},
    { row: true, centered: true },
    { gap: '$gap8', p: 7, backgroundColor: '$surface1' },
    { position: 'absolute', top: 4, zIndex: 3, overflow: 'hidden' },
    { '$theme-dark': { backgroundColor: '$surface2' }, hoverStyle: { opacity: 0.5 } },
    { maxContent: true, transform: [{ translateX: 4 }] },
  ]

  it('attaches exactly the shared pure compiler output', async () => {
    for (const props of CASES) {
      const mounted = await renderNative(props)
      // The native lane's one divergence is unresolvable shadow color tokens
      // (dropped instead of thrown — see the shadow describe below); on every
      // other surface it is byte-identical to the web compiler.
      expect(mounted.host().props['className']).toBe(nativeFlexCompatClassName(props))
      expect(mounted.host().props['className']).toBe(flexCompatClassName(props))
      mounted.unmount()
    }
  })
})

describe('non-RN display values never reach the native className', () => {
  it('strips a pool-/variant-scoped display under every carrier while the compiler stays byte-identical', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const props: FlexCompatProps = {
      '$platform-web': { display: 'grid' },
      '$theme-dark': { display: 'inline-grid' },
      $md: { display: 'block' },
    } as FlexCompatProps
    // The compiler still emits every token (web parity depends on it)…
    const compiled = nativeFlexCompatClassName(props).split(' ')
    for (const token of ['grid', 'dark:inline-grid', 'media-md:block']) {
      expect(compiled, token).toContain(token)
    }
    // …and the leg attaches none of them: `grid` is scanner-visible AND in the
    // native safelist, so unstripped it resolves to display:"grid" in Yoga.
    const mounted = await renderNative(props)
    const attached = (mounted.host().props['className'] as string).split(' ')
    for (const token of ['grid', 'dark:inline-grid', 'media-md:block']) {
      expect(attached, token).not.toContain(token)
    }
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    for (const name of ['$platform-web.display', '$theme-dark.display', '$md.display']) {
      expect(warned, name).toContain(name)
    }
    mounted.unmount()
    warn.mockRestore()
  })

  it('keeps RN-valid display values — a $platform-web display:none still hides on device', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative({ '$platform-web': { display: 'none' } } as FlexCompatProps)
    expect((mounted.host().props['className'] as string).split(' ')).toContain('hidden')
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('.display')
    mounted.unmount()
    warn.mockRestore()
  })

  it('strips and warns for the top-level display prop too — same class-lane seam', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative({ display: 'inline-flex' } as FlexCompatProps)
    expect((mounted.host().props['className'] as string).split(' ')).not.toContain('inline-flex')
    expect(warn.mock.calls.some((call) => String(call[0]).includes('"display"'))).toBe(true)
    mounted.unmount()
    warn.mockRestore()
  })
})

describe('shadow color tokens must not crash the native leg', () => {
  it('mounts with shadowColor="$shadowColor" — the always-mounted tab-bar shape from the device QA crash', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // The AnimatedFlex sliding-background call site, prop-for-prop: before the
    // policy split, compiling this className threw at mount and took the app
    // down at startup. Deliberately NOT asserting whether the box-shadow
    // declaration resolves or drops — that turns on the token's current
    // compat-map membership (the widening axis), and this pin must hold on
    // both sides of it.
    const mounted = await renderNative({
      height: '100%',
      width: 64,
      backgroundColor: '$surface2',
      borderRadius: '$roundedFull',
      borderWidth: 1,
      borderColor: '$surface3',
      shadowColor: '$shadowColor',
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 6,
      shadowOpacity: 0.05,
    })
    expect(mounted.host()).toBeDefined()
    expect(mounted.host().props['className']).toContain('bg-surface2')
    mounted.unmount()
    warn.mockRestore()
  })

  it('drops the box-shadow declaration for a token outside the compat maps and dev-warns once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative({ shadowColor: '$notARealShadowColor', shadowRadius: 4 })
    expect(mounted.host().props['className']).not.toContain('[box-shadow:')
    const messages = warn.mock.calls.map((call) => String(call[0]))
    expect(messages.some((message) => message.includes('shadow color token "$notARealShadowColor"'))).toBe(true)
    mounted.unmount()
    warn.mockRestore()
  })
})

describe('arbitrary numerics land on the RN style object, tokens stay classes', () => {
  it('supplies RN declarations for the runtime-interpolated families', async () => {
    const mounted = await renderNative({
      gap: '$gap8',
      p: 7,
      width: 100,
      maxWidth: '50%',
      borderRadius: '$rounded12',
      opacity: 0.5,
      zIndex: 3,
      flexGrow: 2,
    })
    expect(mounted.style()).toMatchObject({
      gap: 8,
      padding: 7,
      width: 100,
      maxWidth: '50%',
      borderRadius: 12,
      opacity: 0.5,
      zIndex: 3,
      flexGrow: 2,
    })
    mounted.unmount()
  })

  it('leaves semantic color tokens to the className so Uniwind.setTheme() still switches them', async () => {
    const mounted = await renderNative({ backgroundColor: '$surface1', borderColor: '$surface3' })
    const style = mounted.style()
    expect(style['backgroundColor']).toBeUndefined()
    expect(style['borderColor']).toBeUndefined()
    expect(mounted.host().props['className']).toContain('bg-surface1')
    expect(mounted.host().props['className']).toContain('border-surface3')
    mounted.unmount()
  })

  it('puts raw CSS colors on the style object (no literal utility exists for them)', async () => {
    const mounted = await renderNative({ backgroundColor: 'rgba(1, 2, 3, 0.5)' })
    expect(mounted.style()['backgroundColor']).toBe('rgba(1, 2, 3, 0.5)')
    mounted.unmount()
  })

  it('declares borderColor itself rather than relying on uniwind injecting #000000', async () => {
    // uniwind sets `borderColor: '#000000'` whenever a resolved style has
    // `borderStyle` without a color, and the parity normalizer masks black
    // border colors as an RN default — so the injection is invisible to the
    // drift ledger. The leg pins the value instead.
    const implicit = await renderNative({ borderWidth: 2 })
    expect(implicit.style()).toMatchObject({ borderWidth: 2, borderColor: '#000000' })
    implicit.unmount()

    const token = await renderNative({ borderWidth: 2, borderColor: '$surface3' })
    expect(token.style()['borderColor']).toBeUndefined()
    token.unmount()
  })

  it('resolves $ tokens on the number-typed props — a raw token string in a Fabric number slot is a hard crash (INFRA-3272)', async () => {
    // The device failure this pins: `zIndex="$sticky"` (HomeScreenPortfolioStatusBar
    // via the AnimatedFlex base swap, PR #38930) reached Fabric as the raw string
    // and crashed home-screen mount with `Exception in HostFunction: Value is a
    // string, expected a number`.
    const mounted = await renderNative({
      zIndex: '$sticky',
      borderWidth: '$spacing1',
      shadowRadius: '$spacing8',
      x: '$spacing4',
    })
    expect(mounted.style()).toMatchObject({
      zIndex: zIndexes.sticky,
      borderWidth: 1,
      shadowRadius: 8,
      transform: [{ translateX: 4 }],
    })
    mounted.unmount()
  })

  it('composes transforms as an RN transform array in the web lane order', async () => {
    const mounted = await renderNative({ y: 1, scale: 0.98, rotate: '45deg' })
    // Web emits `[transform:translateY(1px)_scale(0.98)_rotate(45deg)]` —
    // descending by prop name. Same order here.
    expect(mounted.style()['transform']).toEqual([{ translateY: 1 }, { scale: 0.98 }, { rotate: '45deg' }])
    mounted.unmount()
  })

  it('user `style` wins over the leg style, like the web leg style attribute', async () => {
    const mounted = await renderNative({ width: 100, style: { width: 200 } as never })
    expect(mounted.style()['width']).toBe(200)
    mounted.unmount()
  })
})

describe('native prop forwarding', () => {
  it('forwards the RN props and drops the DOM-only ones', async () => {
    const mounted = await renderNative({
      testID: 'flex',
      nativeID: 'native-id',
      accessibilityLabel: 'label',
      accessibilityRole: 'button',
      accessibilityHint: 'hint',
      'aria-label': 'aria',
      hitSlop: 8,
      collapsable: false,
      removeClippedSubviews: true,
      // DOM-only — must not reach a native host. `title` is omitted from
      // FlexCompatProps entirely (INFRA-3751 sibling — see ./props.ts), so
      // it is not exercised here: the type system now rejects it outright,
      // a stronger guarantee than a runtime drop.
      href: 'https://example.com',
      target: '_blank',
      tabIndex: -1,
      htmlFor: 'x',
      dangerouslySetInnerHTML: { __html: '<b>x</b>' },
    })
    const hostProps = mounted.host().props
    expect(hostProps).toMatchObject({
      testID: 'flex',
      nativeID: 'native-id',
      accessibilityLabel: 'label',
      accessibilityRole: 'button',
      accessibilityHint: 'hint',
      'aria-label': 'aria',
      hitSlop: 8,
      collapsable: false,
      removeClippedSubviews: true,
    })
    for (const key of ['href', 'target', 'title', 'tabIndex', 'htmlFor', 'dangerouslySetInnerHTML', 'tag']) {
      expect(hostProps[key], key).toBeUndefined()
    }
    mounted.unmount()
  })

  it('maps `disabled` onto accessibilityState (RN View has no disabled prop)', async () => {
    const mounted = await renderNative({ disabled: true, accessibilityState: { selected: true } })
    expect(mounted.host().props['accessibilityState']).toEqual({ selected: true, disabled: true })
    expect(mounted.host().props['aria-disabled']).toBe(true)
    mounted.unmount()
  })
})

describe('press props fire on the native leg (INFRA-3536)', () => {
  // Drive the responder wiring the way RN's responder system does: claim via
  // onStartShouldSetResponder, then grant/release/terminate. The wiring calls
  // event.persist() before arming the long-press timer.
  const pressEvent = (): { persist: () => void } => ({ persist: () => undefined })
  const claims = (host: ReactTestInstance): boolean =>
    (host.props['onStartShouldSetResponder'] as (() => boolean) | undefined)?.() === true
  const grant = (host: ReactTestInstance): void => {
    act(() => {
      ;(host.props['onResponderGrant'] as (event: unknown) => void)(pressEvent())
    })
  }
  const release = (host: ReactTestInstance): void => {
    act(() => {
      ;(host.props['onResponderRelease'] as (event: unknown) => void)(pressEvent())
    })
  }
  const terminate = (host: ReactTestInstance): void => {
    act(() => {
      ;(host.props['onResponderTerminate'] as (event: unknown) => void)(pressEvent())
    })
  }

  it('claims the responder and dispatches a tap through the handlers in Pressability order, lanes intact', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const handlers = Object.fromEntries(PRESS_HANDLER_KEYS.map((key) => [key, vi.fn()]))
    const props = { ...handlers, gap: '$gap8' } as FlexCompatProps
    const mounted = await renderNative(props)
    expect(claims(mounted.host())).toBe(true)
    grant(mounted.host())
    expect(handlers['onPressIn']).toHaveBeenCalledTimes(1)
    release(mounted.host())
    expect(handlers['onPressOut']).toHaveBeenCalledTimes(1)
    expect(handlers['onPress']).toHaveBeenCalledTimes(1)
    // A quick tap must not long-press.
    expect(handlers['onLongPress']).not.toHaveBeenCalled()
    // Pressability's release order: deactivate (onPressOut) precedes onPress.
    const order = (key: string): number => (handlers[key] as Mock).mock.invocationCallOrder[0] ?? -1
    expect(order('onPressIn')).toBeLessThan(order('onPressOut'))
    expect(order('onPressOut')).toBeLessThan(order('onPress'))
    // The class and style lanes are untouched by the press wiring.
    expect(mounted.host().props['className']).toBe(nativeFlexCompatClassName(props))
    expect(mounted.style()).toMatchObject({ gap: 8 })
    // The handlers are no longer in the dead-prop ledger: no dev warning.
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('onPress')
    mounted.unmount()
    warn.mockRestore()
  })

  it('long-presses at 500ms from grant (Pressability default) and suppresses onPress on release', async () => {
    vi.useFakeTimers()
    try {
      const onPress = vi.fn()
      const onLongPress = vi.fn()
      const onPressOut = vi.fn()
      const mounted = await renderNative({ onPress, onLongPress, onPressOut } as unknown as FlexCompatProps)
      grant(mounted.host())
      act(() => {
        vi.advanceTimersByTime(499)
      })
      expect(onLongPress).not.toHaveBeenCalled()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(onLongPress).toHaveBeenCalledTimes(1)
      release(mounted.host())
      expect(onPress).not.toHaveBeenCalled()
      expect(onPressOut).toHaveBeenCalledTimes(1)
      mounted.unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('honours an onLongPress attached mid-gesture — the timer arms at grant and gates on the handler at fire time', async () => {
    vi.useFakeTimers()
    try {
      const { FlexCompat } = await nativeLeg()
      const onPress = vi.fn()
      const onLongPress = vi.fn()
      let renderer: ReactTestRenderer | undefined
      act(() => {
        renderer = create(createElement(FlexCompat, { onPress } as never))
      })
      const tree = renderer as ReactTestRenderer
      const host = (): ReactTestInstance => tree.root.findByType('RNView' as never)
      grant(host())
      act(() => {
        tree.update(createElement(FlexCompat, { onPress, onLongPress } as never))
      })
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(onLongPress).toHaveBeenCalledTimes(1)
      // The long press still cancels onPress on release.
      release(host())
      expect(onPress).not.toHaveBeenCalled()
      act(() => {
        tree.unmount()
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('dispatches each handler independently — a single-handler call site claims and fires just that key', async () => {
    vi.useFakeTimers()
    try {
      // Expected fire count for one full grant → 500ms → release cycle.
      for (const key of PRESS_HANDLER_KEYS) {
        const handler = vi.fn()
        const mounted = await renderNative({ [key]: handler } as FlexCompatProps)
        expect(claims(mounted.host()), key).toBe(true)
        grant(mounted.host())
        act(() => {
          vi.advanceTimersByTime(500)
        })
        release(mounted.host())
        expect(handler, key).toHaveBeenCalledTimes(1)
        mounted.unmount()
      }
    } finally {
      vi.useRealTimers()
    }
  })

  it('termination (a scroll container stealing the responder) fires onPressOut only, and stealing is allowed', async () => {
    const handlers = Object.fromEntries(PRESS_HANDLER_KEYS.map((key) => [key, vi.fn()]))
    const mounted = await renderNative(handlers as FlexCompatProps)
    expect((mounted.host().props['onResponderTerminationRequest'] as () => boolean)()).toBe(true)
    grant(mounted.host())
    terminate(mounted.host())
    expect(handlers['onPressIn']).toHaveBeenCalledTimes(1)
    expect(handlers['onPressOut']).toHaveBeenCalledTimes(1)
    expect(handlers['onPress']).not.toHaveBeenCalled()
    expect(handlers['onLongPress']).not.toHaveBeenCalled()
    mounted.unmount()
  })

  it('a handler-less host carries NO wiring and NO a11y claim — a plain View, byte-identical to before', async () => {
    // Responder-inert (nothing to claim with), a11y-silent (no disabled state,
    // no aria-disabled — the Pressable-host approach leaked both), hit-test
    // semantics untouched (no pointerEvents override).
    for (const props of [{}, { onPress: null } as unknown as FlexCompatProps]) {
      const mounted = await renderNative(props)
      for (const key of [
        'onStartShouldSetResponder',
        'onResponderGrant',
        'onResponderRelease',
        'onResponderTerminate',
        'onResponderTerminationRequest',
      ]) {
        expect(mounted.host().props[key], key).toBeUndefined()
      }
      expect(mounted.host().props['disabled']).toBeUndefined()
      expect(mounted.host().props['aria-disabled']).toBeUndefined()
      expect(mounted.host().props['accessibilityState']).toBeUndefined()
      expect(mounted.host().props['pointerEvents']).toBeUndefined()
      mounted.unmount()
    }
  })

  it('disabled detaches the wiring like the web leg; only the allow-list a11y mapping remains', async () => {
    const onPress = vi.fn()
    const mounted = await renderNative({ disabled: true, onPress } as unknown as FlexCompatProps)
    expect(mounted.host().props['onStartShouldSetResponder']).toBeUndefined()
    expect(mounted.host().props['onResponderRelease']).toBeUndefined()
    // The USER's disabled still maps through nativeCompatProps, as everywhere.
    expect(mounted.host().props['aria-disabled']).toBe(true)
    expect(mounted.host().props['accessibilityState']).toEqual({ disabled: true })
    mounted.unmount()
  })

  it('keeps the SAME View host across handler present→absent→present re-renders — no subtree remount', async () => {
    // The element type never varies (a plain View for the component's whole
    // life), so a call site's `onPress={cond ? fn : undefined}` attaches and
    // detaches the responder wiring without remounting the subtree
    // (lost state/focus/scroll) whenever the condition flips.
    const { FlexCompat } = await nativeLeg()
    let childMounts = 0
    function MountCounter(): null {
      useEffect(() => {
        childMounts += 1
      }, [])
      return null
    }
    const onPress = vi.fn()
    const render = (handler: typeof onPress | undefined): ReturnType<typeof createElement> =>
      createElement(FlexCompat, { onPress: handler } as never, createElement(MountCounter))
    let renderer: ReactTestRenderer | undefined
    act(() => {
      renderer = create(render(onPress))
    })
    const tree = renderer as ReactTestRenderer
    const host = (): ReactTestInstance => tree.root.findByType('RNView' as never)
    expect(childMounts).toBe(1)
    expect(claims(host())).toBe(true)

    act(() => {
      tree.update(render(undefined))
    })
    // The wiring detaches; the subtree does not remount.
    expect(host().props['onStartShouldSetResponder']).toBeUndefined()
    expect(childMounts).toBe(1)

    act(() => {
      tree.update(render(onPress))
    })
    grant(host())
    release(host())
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(childMounts).toBe(1)
    act(() => {
      tree.unmount()
    })
  })

  it('contributes NO implicit a11y props, live or not — legacy Tamagui parity; the allow-list owns accessible', async () => {
    // An implicit `accessible: true` on a live tap target would FLATTEN the
    // a11y subtree (RN reads an accessible View as one element, hiding every
    // focusable descendant), and legacy Tamagui's native press path sets
    // neither accessible nor focusable — call sites opt in exactly as they
    // did pre-conversion.
    for (const props of [{}, { onPress: vi.fn() } as unknown as FlexCompatProps]) {
      const mounted = await renderNative(props)
      expect(mounted.host().props['accessible']).toBeUndefined()
      expect(mounted.host().props['focusable']).toBeUndefined()
      expect(mounted.host().props['accessibilityRole']).toBeUndefined()
      mounted.unmount()
    }

    // Explicit a11y props forward through nativeCompatProps — its single owner.
    const optedIn = await renderNative({
      accessible: true,
      accessibilityRole: 'button',
      onPress: vi.fn(),
    } as unknown as FlexCompatProps)
    expect(optedIn.host().props['accessible']).toBe(true)
    expect(optedIn.host().props['accessibilityRole']).toBe('button')
    optedIn.unmount()
  })

  it('finishes an in-flight gesture when a re-render detaches the handlers: pending onPressOut fires, the long-press timer dies', async () => {
    vi.useFakeTimers()
    try {
      const { FlexCompat } = await nativeLeg()
      const onPressOut = vi.fn()
      const onLongPress = vi.fn()
      const handlers = { onPressOut, onLongPress, onPress: vi.fn() }
      let renderer: ReactTestRenderer | undefined
      act(() => {
        renderer = create(createElement(FlexCompat, handlers as never))
      })
      const tree = renderer as ReactTestRenderer
      const host = (): ReactTestInstance => tree.root.findByType('RNView' as never)
      grant(host())

      // The wiring leaves the host with this commit, so the gesture is
      // finished eagerly instead of dangling half-pressed.
      act(() => {
        tree.update(
          createElement(FlexCompat, { onPressOut: undefined, onLongPress: undefined, onPress: undefined } as never),
        )
      })
      expect(host().props['onResponderRelease']).toBeUndefined()
      expect(onPressOut).toHaveBeenCalledTimes(1)

      // The grant-time long-press timer must not fire a handler its call site removed.
      act(() => {
        vi.advanceTimersByTime(500)
      })
      expect(onLongPress).not.toHaveBeenCalled()
      act(() => {
        tree.unmount()
      })
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('onLayout', () => {
  it('passes the caller handler straight to RN onLayout (no ResizeObserver lane)', async () => {
    const onLayout = vi.fn()
    const mounted = await renderNative({ onLayout })
    expect(mounted.host().props['onLayout']).toBe(onLayout)
    const event = { nativeEvent: { layout: { x: 1, y: 2, width: 3, height: 4 } } }
    act(() => {
      ;(mounted.host().props['onLayout'] as (e: unknown) => void)(event)
    })
    // The RN event object reaches the handler unmodified — RN's x/y are
    // PARENT-relative where the web leg synthesised viewport-relative values
    // from getBoundingClientRect().
    expect(onLayout).toHaveBeenCalledWith(event)
    mounted.unmount()
  })
})

describe('dev diagnostics for values with no native expression', () => {
  it('warns once per prop for web-only long-tail values', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const first = await renderNative({ backdropFilter: 'blur(4px)' })
    first.unmount()
    const second = await renderNative({ backdropFilter: 'blur(8px)' })
    second.unmount()
    expect(warn.mock.calls.filter((call) => String(call[0]).includes('backdropFilter'))).toHaveLength(1)
    warn.mockRestore()
  })

  it('warns for `maxContent` — `w-max` evaporates natively and a class-map miss is silent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative({ maxContent: true })
    expect(mounted.host().props['className']).toContain('w-max')
    expect(warn.mock.calls.some((call) => String(call[0]).includes('maxContent'))).toBe(true)
    mounted.unmount()
    warn.mockRestore()
  })

  it('warns for the scoped pools that cannot resolve natively', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // Group-state key from `compat/group`, not a hand-written literal: that module owns the spelling.
    const groupHover = groupStatePropKey('hover')
    const mounted = await renderNative({
      hoverStyle: { backgroundColor: '$surface2' },
      $md: { gap: 8 },
      [groupHover]: { opacity: 0.5 },
      '$theme-light': { backgroundColor: '$surface1' },
    })
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    for (const key of ['hoverStyle', '$md', groupHover, '$theme-light']) {
      expect(warned, key).toContain(key)
    }
    mounted.unmount()
    warn.mockRestore()
  })

  it('does NOT warn for a group pool passed as explicitly undefined — a pool that is not there', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // `Object.keys` sees an explicitly-undefined prop, so the group-state prefix scan used to
    // warn about a pool with no value while both sibling ledgers filtered it out.
    // Nothing upstream strips undefined props — the leg hands `props` straight to
    // `compatLayoutNativeStyle` — so this was reachable, not latent.
    const groupHover = groupStatePropKey('hover')
    const mounted = await renderNative({ [groupHover]: undefined } as FlexCompatProps)
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain(groupHover)
    mounted.unmount()
    warn.mockRestore()
  })

  it('warns for `overflow` values RN cannot express, and applies the ones it can', async () => {
    for (const overflow of ['auto', 'unset'] as const) {
      __resetNativeStyleWarnings()
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      const mounted = await renderNative({ overflow } as FlexCompatProps)
      // Neither applied nor carried by a class (`overflow-${value}` is runtime-composed,
      // so it is scanner-invisible): clips on web, does not clip on device.
      expect(mounted.style()['overflow'], overflow).toBeUndefined()
      expect(warn.mock.calls.map((call) => String(call[0])).join('\n'), overflow).toContain('overflow')
      mounted.unmount()
      warn.mockRestore()
    }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative({ overflow: 'hidden' } as FlexCompatProps)
    expect(mounted.style()['overflow']).toBe('hidden')
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('overflow')
    mounted.unmount()
    warn.mockRestore()
  })

  it('warns that `$platform-web` is NOT inert on native — it is the pool that lands, not one that drops', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // Verbatim the `$platform-web spacing` case that `EXPECTED_PLATFORM_WEB_LEAKS`
    // (packages/tailwind/src/parity/flex/native-expectations.ts) measures leaking
    // paddingLeft/paddingRight/cursor onto a real device.
    const mounted = await renderNative({ '$platform-web': { px: '$spacing8', cursor: 'pointer' } } as never)
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    expect(warned).toContain('$platform-web')
    expect(warned).toContain('is not inert on native')
    // Pool-level wording only: which keys actually reach the device turns on
    // uniwind's build-time scanner, which is invisible from here.
    expect(warned).not.toContain('dropped on native')
    expect(warned).not.toContain('has no React Native equivalent')
    for (const key of ['px', 'paddingLeft', 'paddingRight', 'cursor']) {
      expect(warned, key).not.toContain(key)
    }
    mounted.unmount()
    warn.mockRestore()
  })

  it('does NOT warn for `$platform-web` when the prop is absent (the check cannot pass vacuously)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // The same declarations on the BASE pool: nothing web-only is in play, so silence.
    const mounted = await renderNative({ px: '$spacing8', cursor: 'pointer' } as never)
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('$platform-web')
    mounted.unmount()
    warn.mockRestore()
  })

  it('warns at the POOL level for `$theme-dark`, in the same shape as `$platform-web`', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // Same epistemic position as `$platform-web`: the `dark:` variant compiles and
    // resolves against `Uniwind.setTheme()`, but its class is scanner-invisible for
    // interpolating and semantic-colour values and the style lane is base-pool-only,
    // so some declarations land and some vanish — and the leg cannot tell which at
    // render time. Measured per case by EXPECTED_THEME_DARK_POOL_GAPS in
    // packages/tailwind/src/parity/text/native-expectations.ts.
    const mounted = await renderNative({ '$theme-dark': { opacity: 0.8, backgroundColor: '$surface2' } } as never)
    const warned = warn.mock.calls.map((call) => String(call[0])).join('\n')
    expect(warned).toContain('$theme-dark')
    expect(warned).toContain('may not reach the device')
    // Pool-level wording only: asserting that a GIVEN key drops needs the build-time
    // fact, so the message must name none of them and must not borrow either of the
    // other two sentences.
    expect(warned).not.toContain('dropped on native')
    expect(warned).not.toContain('has no React Native equivalent')
    expect(warned).not.toContain('is not inert on native')
    for (const key of ['opacity', 'backgroundColor', '$surface2']) {
      expect(warned, key).not.toContain(key)
    }
    mounted.unmount()
    warn.mockRestore()
  })

  it('does NOT warn for `$theme-dark` when the prop is absent, nor for `forceStyle`', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    // The same declarations on the BASE pool: no theme-scoped class is in play, so
    // silence — the check cannot pass vacuously. `forceStyle` works natively.
    const mounted = await renderNative({ opacity: 0.8, backgroundColor: '$surface2', forceStyle: 'hover' } as never)
    expect(warn).not.toHaveBeenCalled()
    mounted.unmount()
    warn.mockRestore()
  })
})

describe('non-native `display` is filtered so web-only values never reach Yoga', () => {
  // A converted call site can hand this leg a web-only `display` through the raw
  // `style` object, which RN types as `flex | none | contents` only — so it must
  // be loosely typed here, exactly as it arrives at runtime.
  const withStyle = (style: Record<string, unknown>): FlexCompatProps => ({ style }) as unknown as FlexCompatProps
  const classNames = (mounted: Mounted): string[] => String(mounted.host().props['className']).split(' ')

  it('drops `display: grid` from the user style object (RN defaults to flex layout)', async () => {
    const mounted = await renderNative(withStyle({ display: 'grid' }))
    expect(mounted.style()['display']).toBeUndefined()
    mounted.unmount()
  })

  it('drops `display: inline-grid` from the user style object', async () => {
    const mounted = await renderNative(withStyle({ display: 'inline-grid' }))
    expect(mounted.style()['display']).toBeUndefined()
    mounted.unmount()
  })

  it('passes `display: flex` and `display: none` from the user style object straight through', async () => {
    for (const display of ['flex', 'none'] as const) {
      const mounted = await renderNative(withStyle({ display }))
      expect(mounted.style()['display'], display).toBe(display)
      mounted.unmount()
    }
  })

  it('drops the `grid` utility from the top-level `display` prop before uniwind resolves the className', async () => {
    // `display: grid` maps to a bare `grid` utility; stripped at the prop layer so
    // uniwind never resolves the className into a `display: grid` RN style.
    const mounted = await renderNative({ display: 'grid' })
    expect(classNames(mounted)).not.toContain('grid')
    expect(mounted.host().props['className']).toBe(nativeFlexCompatClassName({}))
    mounted.unmount()
  })

  it('keeps a top-level `display: none` — its `hidden` utility is a valid RN display', async () => {
    const mounted = await renderNative({ display: 'none' })
    expect(classNames(mounted)).toContain('hidden')
    mounted.unmount()
  })

  it('filters the longhand style display even when a top-level display is set (longhand wins)', async () => {
    // The compat layer emits both carriers with the longhand `style` winning; an
    // unfiltered `grid` there would override the top-level `flex` and reach Yoga.
    const mounted = await renderNative({ display: 'flex', ...withStyle({ display: 'grid' }) })
    expect(mounted.style()['display']).toBeUndefined()
    expect(classNames(mounted)).toContain('flex')
    mounted.unmount()
  })

  it('filters a web-only top-level display while a real longhand style display survives', async () => {
    const mounted = await renderNative({ display: 'grid', ...withStyle({ display: 'flex' }) })
    expect(mounted.style()['display']).toBe('flex')
    expect(classNames(mounted)).not.toContain('grid')
    mounted.unmount()
  })

  // The allowlist (`RN_DISPLAY_VALUES`) closes the gap a `grid`-only denylist left
  // open: every OTHER web-only `DisplayValue` compiles the same unconditional way.
  it('drops every web-only `display` from the user style object, not just grid', async () => {
    for (const display of ['block', 'inline', 'inline-flex'] as const) {
      const mounted = await renderNative(withStyle({ display }))
      expect(mounted.style()['display'], display).toBeUndefined()
      mounted.unmount()
    }
  })

  it('passes `display: contents` from the user style object straight through', async () => {
    const mounted = await renderNative(withStyle({ display: 'contents' }))
    expect(mounted.style()['display']).toBe('contents')
    mounted.unmount()
  })

  it('strips every web-only top-level `display` utility from the className, not just grid', async () => {
    for (const display of ['block', 'inline', 'inline-flex'] as const) {
      const mounted = await renderNative({ display })
      expect(classNames(mounted), display).not.toContain(display)
      // Stripping the prop leaves the exact className a display-less props copy compiles.
      expect(mounted.host().props['className'], display).toBe(nativeFlexCompatClassName({}))
      mounted.unmount()
    }
  })

  it('keeps a top-level `display: contents` — a valid RN display', async () => {
    const mounted = await renderNative({ display: 'contents' })
    expect(classNames(mounted)).toContain('contents')
    mounted.unmount()
  })

  it('warns when a non-native `display` is stripped from the top-level prop', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative({ display: 'grid' })
    expect(warn.mock.calls.some((call) => String(call[0]).includes('display'))).toBe(true)
    mounted.unmount()
    warn.mockRestore()
  })

  it('warns when a non-native `display` is stripped from the user style object', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative(withStyle({ display: 'block' }))
    expect(warn.mock.calls.some((call) => String(call[0]).includes('display'))).toBe(true)
    mounted.unmount()
    warn.mockRestore()
  })

  it('does NOT warn for `display` when the value is RN-valid or absent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const mounted = await renderNative({ display: 'flex', ...withStyle({ display: 'contents' }) })
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).not.toContain('"display"')
    mounted.unmount()
    warn.mockRestore()
  })
})
