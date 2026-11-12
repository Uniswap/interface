/**
 * INFRA-3492: pins the native leg's non-style prop pass-through.
 *
 * The bug this guards: `TouchableAreaCompat.native.tsx` fed its `<Pressable>`
 * from a fixed, named prop list with no pass-through, so any prop outside that
 * list was silently dropped — including `collapsable={false}`, which
 * react-native-gesture-handler's `GestureDetector` injects into its child via
 * `React.cloneElement` to keep the view from being flattened away on the New
 * Architecture. The leg now forwards the shared native allow-list
 * (`compat/native-props.ts`, the Flex/View/Text leg contract).
 *
 * Same scope caveat as the sibling `platform-legs.test.ts` suites: jsdom +
 * react-test-renderer with the hand-written react-native stand-in — a
 * component-wiring pin, not native evidence.
 */
import { createElement } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { touchableAreaCompatNativeClassName } from './compile'
import type { TouchableAreaCompatProps, TouchableAreaVariant } from './props'
import { resolveTouchableAreaCompatProps } from './resolve'

vi.mock('react-native', () => import('../compat/testing/react-native-mock'))
vi.mock('react-native-gesture-handler', () => import('../button-compat/testing/gesture-handler-mock'))

// A mutable stand-in for uniwind's runtime theme (INFRA-3507's per-theme gap):
// the shared `../button-compat/testing/uniwind-mock` always resolves 'light',
// which cannot exercise the active-theme branch the background guard now
// takes, so this suite needs its own settable mock. `vi.hoisted` is required
// because `vi.mock` factories run before this module's own top-level code.
const uniwindThemeState = vi.hoisted(() => ({ theme: 'light' as 'light' | 'dark' }))
vi.mock('uniwind', () => ({
  useResolveClassNames: (): Record<string, unknown> => ({}),
  useUniwind: (): { theme: string } => ({ theme: uniwindThemeState.theme }),
  Uniwind: { setTheme: (): void => undefined },
}))

// react-test-renderer's act() needs the explicit opt-in outside jsdom setups.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Explicit .native specifier: the mycelium vitest config resolves `.web.*`
// first, so a bare './TouchableAreaCompat' import would load the web leg.
async function nativeLeg(): Promise<typeof import('./TouchableAreaCompat.native')> {
  return import('./TouchableAreaCompat.native')
}

interface Mounted {
  host: () => ReactTestInstance
  unmount: () => void
}

async function renderNative(props: TouchableAreaCompatProps): Promise<Mounted> {
  const { TouchableAreaCompat } = await nativeLeg()
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(createElement(TouchableAreaCompat, props as never))
  })
  if (renderer === undefined) {
    throw new Error('TouchableAreaCompat.native render failed')
  }
  const mounted = renderer
  return {
    host: () => mounted.root.findByType('RNGHPressable' as never),
    unmount: (): void => {
      act(() => {
        mounted.unmount()
      })
    },
  }
}

describe('native prop forwarding (INFRA-3492)', () => {
  it('forwards collapsable={false} — the RNGH GestureDetector cloneElement injection — to the Pressable', async () => {
    const mounted = await renderNative({ collapsable: false })
    expect(mounted.host().props['collapsable']).toBe(false)
    mounted.unmount()
  })

  it('forwards the rest of the shared native allow-list and drops DOM-only props', async () => {
    const mounted = await renderNative({
      nativeID: 'native-id',
      accessibilityLabel: 'label',
      accessibilityHint: 'hint',
      'aria-label': 'aria',
      removeClippedSubviews: true,
      // DOM-only — must not reach a native host. `title` is no longer part of
      // the public prop type (it collided with call sites carrying their own
      // `title?: ReactNode` — see props.ts), but the native allow-list must
      // still drop it if one arrives at runtime, so it is spread in untyped
      // rather than removed from this assertion.
      href: 'https://example.com',
      target: '_blank',
      tabIndex: -1,
      htmlFor: 'x',
      dangerouslySetInnerHTML: { __html: '<b>x</b>' },
      ...({ title: 'tooltip' } as Record<string, unknown>),
    })
    const hostProps = mounted.host().props
    expect(hostProps).toMatchObject({
      nativeID: 'native-id',
      accessibilityLabel: 'label',
      accessibilityHint: 'hint',
      'aria-label': 'aria',
      removeClippedSubviews: true,
    })
    for (const key of ['href', 'target', 'title', 'tabIndex', 'htmlFor', 'dangerouslySetInnerHTML', 'tag']) {
      expect(hostProps[key], key).toBeUndefined()
    }
    mounted.unmount()
  })

  it('keeps the explicit props over the pass-through: resolved hit-slop and the role default win', async () => {
    // An explicit call-site null must still disable touch expansion — the
    // pass-through carries `hitSlop` verbatim, so the leg's resolved value
    // (spread AFTER the allow-list) has to win.
    const mounted = await renderNative({ hitSlop: null })
    expect(mounted.host().props['hitSlop']).toBeUndefined()
    expect(mounted.host().props['accessibilityRole']).toBe('button')
    mounted.unmount()
  })

  // Role precedence contract (INFRA-3306). RN core gives `role` precedence
  // over `accessibilityRole` when BOTH reach the host (Android
  // ReactAccessibilityDelegate, iOS AccessibilityProps), so the leg resolves
  // the pair itself: only one of the two may ever reach the Pressable.
  it('role only: forwards the role and suppresses the accessibilityRole default', async () => {
    const mounted = await renderNative({ role: 'none' })
    expect(mounted.host().props['role']).toBe('none')
    expect(mounted.host().props['accessibilityRole']).toBeUndefined()
    mounted.unmount()
  })

  it('both set: an explicit accessibilityRole wins — the forwarded role is suppressed', async () => {
    const mounted = await renderNative({ role: 'none', accessibilityRole: 'imagebutton' })
    expect(mounted.host().props['accessibilityRole']).toBe('imagebutton')
    expect(mounted.host().props['role']).toBeUndefined()
    mounted.unmount()
  })

  it('accessibilityRole only: forwards the accessibilityRole and suppresses the role', async () => {
    const mounted = await renderNative({ accessibilityRole: 'imagebutton' })
    expect(mounted.host().props['accessibilityRole']).toBe('imagebutton')
    expect(mounted.host().props['role']).toBeUndefined()
    mounted.unmount()
  })

  it("neither set: the 'button' default applies alone", async () => {
    const mounted = await renderNative({})
    expect(mounted.host().props['accessibilityRole']).toBe('button')
    expect(mounted.host().props['role']).toBeUndefined()
    mounted.unmount()
  })

  it('an explicit accessibilityRole={null} counts as absent — role passes through and the button default is not swallowed', async () => {
    // A null accessibilityRole must resolve the same as an absent one on
    // BOTH sides of the precedence check, or role and the 'button' default
    // silently cancel each other out (neither prop reaches the host).
    const mounted = await renderNative({ accessibilityRole: null as never, role: 'none' })
    expect(mounted.host().props['role']).toBe('none')
    expect(mounted.host().props['accessibilityRole']).toBeUndefined()
    mounted.unmount()
  })

  it('merges disabled into a caller accessibilityState instead of dropping it', async () => {
    const mounted = await renderNative({ disabled: true, accessibilityState: { selected: true } })
    expect(mounted.host().props['accessibilityState']).toEqual({ selected: true, disabled: true })
    // The legacy native frame is style-only while disabled — the Pressable is
    // never hard-disabled (descendant touchables must stay pressable).
    expect(mounted.host().props['disabled']).toBeUndefined()
    mounted.unmount()
  })

  it('maps a plain disabled (no caller accessibilityState) onto accessibilityState', async () => {
    const mounted = await renderNative({ disabled: true })
    expect(mounted.host().props['accessibilityState']).toEqual({ disabled: true })
    mounted.unmount()
  })

  it('disabled: gates the wrapper press family in JS and resolves the wrapper to pointerEvents box-none, keeping a nested child pressable', async () => {
    const { TouchableAreaCompat } = await nativeLeg()
    const wrapperPress = vi.fn()
    const childPress = vi.fn()
    let renderer: ReactTestRenderer | undefined
    act(() => {
      renderer = create(
        createElement(
          TouchableAreaCompat,
          { disabled: true, onPress: wrapperPress } as never,
          createElement(TouchableAreaCompat, { testID: 'child', onPress: childPress } as never),
        ),
      )
    })
    if (renderer === undefined) {
      throw new Error('TouchableAreaCompat.native render failed')
    }
    const [wrapper, child] = renderer.root.findAllByType('RNGHPressable' as never)
    if (wrapper === undefined || child === undefined) {
      throw new Error('expected a wrapper and a nested child Pressable')
    }
    for (const key of ['onPress', 'onPressIn', 'onPressOut', 'onLongPress']) {
      expect(wrapper.props[key], key).toBeUndefined()
    }
    // The wrapper must resolve to `box-none`, never the web polyfill pair —
    // uniwind flattens the pair's unresolvable `[&>*]` child half to a
    // subtree-swallowing `pointerEvents: 'none'`. The leg paints classes
    // through style (RNGH Pressable drops className), so pin the compiled
    // class string at the compiler.
    const compiled = touchableAreaCompatNativeClassName({ disabled: true })
    expect(compiled).toContain('[pointer-events:box-none]')
    expect(compiled).not.toContain('[&>*]:[pointer-events:auto]')
    // Press dispatch rides the responder pipeline, not the host gesture props.
    const pressEvent = { persist: (): void => {}, stopPropagation: vi.fn() }
    act(() => {
      ;(child.props['onResponderGrant'] as (event: unknown) => void)(pressEvent)
      ;(child.props['onResponderRelease'] as (event: unknown) => void)(pressEvent)
    })
    expect(childPress).toHaveBeenCalledTimes(1)
    expect(wrapperPress).not.toHaveBeenCalled()
    const mounted = renderer
    act(() => {
      mounted.unmount()
    })
  })
})

/**
 * INFRA-3507: pins "unstyled renders no background on native" as far as this
 * harness can reach. It cannot exercise the real uniwind on-device class
 * store or RNGH's actual native host (both are mocked here — see the module
 * header), so it does not reproduce the reported device-only fill; it pins
 * the two things this leg controls directly: the resolved prop pool and the
 * compiled class string never carry a background for a variant that
 * shouldn't have one, and the leg's own inline-style safety net + explicit
 * `android_ripple` reach the host regardless of what the class lookup does.
 */
describe('no unintended background on native (INFRA-3507)', () => {
  beforeEach(() => {
    uniwindThemeState.theme = 'light'
  })

  const NO_BACKGROUND_VARIANTS: TouchableAreaVariant[] = ['unstyled', 'none', 'outlined', 'raised']

  it.each(NO_BACKGROUND_VARIANTS)('resolves no backgroundColor for variant=%s at rest', (variant) => {
    const resolved = resolveTouchableAreaCompatProps({ variant })
    expect(resolved.backgroundColor).toBeUndefined()
  })

  it('compiles no surface/background-color class for the unstyled variant', () => {
    const compiled = touchableAreaCompatNativeClassName({ variant: 'unstyled' })
    expect(compiled).toContain('bg-transparent')
    expect(compiled).not.toMatch(/bg-surface/)
  })

  it.each(NO_BACKGROUND_VARIANTS)(
    'forces an explicit transparent backgroundColor in the resolved style for variant=%s',
    async (variant) => {
      const mounted = await renderNative({ variant })
      const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
      expect(resolvedStyle).toContainEqual({ backgroundColor: 'transparent' })
      mounted.unmount()
    },
  )

  it('does not force transparent over a variant that defines its own background (filled)', async () => {
    const mounted = await renderNative({ variant: 'filled' })
    const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
    expect(resolvedStyle).not.toContainEqual({ backgroundColor: 'transparent' })
    mounted.unmount()
  })

  it('does not force transparent over floating (defines $surface5)', async () => {
    const mounted = await renderNative({ variant: 'floating' })
    const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
    expect(resolvedStyle).not.toContainEqual({ backgroundColor: 'transparent' })
    mounted.unmount()
  })

  it('does not force transparent over disabled raised (defines $surface2)', async () => {
    const mounted = await renderNative({ variant: 'raised', disabled: true })
    const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
    expect(resolvedStyle).not.toContainEqual({ backgroundColor: 'transparent' })
    mounted.unmount()
  })

  it('pins the Android ripple to fully transparent regardless of variant', async () => {
    const mounted = await renderNative({ variant: 'unstyled' })
    expect(mounted.host().props['android_ripple']).toEqual({ color: 'transparent' })
    mounted.unmount()
  })
})

/**
 * INFRA-3507 follow-up: `$theme-dark`/`$theme-light` resolve independently on
 * device (they compile to separate `dark:`/`light:`-prefixed classes), so the
 * guard must gate on the theme actually active at render time, not on
 * "either theme defines a background" — otherwise a background painted only
 * in the OTHER theme wrongly suppresses the transparent fallback in the
 * theme that is actually rendering (reopening the exact bug this PR closes,
 * for single-theme callers).
 */
describe('per-theme background guard (INFRA-3507)', () => {
  beforeEach(() => {
    uniwindThemeState.theme = 'light'
  })

  it('still forces transparent in light theme when only $theme-dark defines a background', async () => {
    const mounted = await renderNative({
      variant: 'unstyled',
      '$theme-dark': { backgroundColor: '$surface5' },
    })
    const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
    expect(resolvedStyle).toContainEqual({ backgroundColor: 'transparent' })
    mounted.unmount()
  })

  it('does not force transparent in dark theme when $theme-dark defines a background', async () => {
    uniwindThemeState.theme = 'dark'
    const mounted = await renderNative({
      variant: 'unstyled',
      '$theme-dark': { backgroundColor: '$surface5' },
    })
    const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
    expect(resolvedStyle).not.toContainEqual({ backgroundColor: 'transparent' })
    mounted.unmount()
  })

  it('still forces transparent in dark theme when only $theme-light defines a background', async () => {
    uniwindThemeState.theme = 'dark'
    const mounted = await renderNative({
      variant: 'unstyled',
      '$theme-light': { backgroundColor: '$surface5' },
    })
    const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
    expect(resolvedStyle).toContainEqual({ backgroundColor: 'transparent' })
    mounted.unmount()
  })

  it('does not force transparent in light theme when $theme-light defines a background', async () => {
    const mounted = await renderNative({
      variant: 'unstyled',
      '$theme-light': { backgroundColor: '$surface5' },
    })
    const resolvedStyle = mounted.host().props['style']({ pressed: false }) as unknown[]
    expect(resolvedStyle).not.toContainEqual({ backgroundColor: 'transparent' })
    mounted.unmount()
  })
})

describe('screen-reader activation', () => {
  const activateEvent = { nativeEvent: { actionName: 'activate' } }

  it('runs onPress when TalkBack activates the area', async () => {
    const onPress = vi.fn()
    const mounted = await renderNative({ onPress })
    act(() => {
      ;(mounted.host().props['onAccessibilityAction'] as (event: unknown) => void)(activateEvent)
    })
    expect(onPress).toHaveBeenCalledTimes(1)
    mounted.unmount()
  })

  it("keeps the caller's own actions and routes them to the caller's handler", async () => {
    const onPress = vi.fn()
    const onAccessibilityAction = vi.fn()
    const mounted = await renderNative({
      onPress,
      accessibilityActions: [{ name: 'longpress' }],
      onAccessibilityAction,
    })
    expect(mounted.host().props['accessibilityActions']).toEqual([{ name: 'longpress' }, { name: 'activate' }])
    const longPressEvent = { nativeEvent: { actionName: 'longpress' } }
    act(() => {
      ;(mounted.host().props['onAccessibilityAction'] as (event: unknown) => void)(longPressEvent)
    })
    expect(onAccessibilityAction).toHaveBeenCalledWith(longPressEvent)
    expect(onPress).not.toHaveBeenCalled()
    mounted.unmount()
  })

  it('leaves a caller-declared activate to the caller', async () => {
    const onPress = vi.fn()
    const onAccessibilityAction = vi.fn()
    const mounted = await renderNative({ onPress, accessibilityActions: [{ name: 'activate' }], onAccessibilityAction })
    act(() => {
      ;(mounted.host().props['onAccessibilityAction'] as (event: unknown) => void)(activateEvent)
    })
    expect(onAccessibilityAction).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
    mounted.unmount()
  })
})
