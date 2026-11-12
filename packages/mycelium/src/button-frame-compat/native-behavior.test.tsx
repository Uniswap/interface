/**
 * Behavioral pins for the NATIVE legs (jsdom + the button-compat native
 * mocks; the full-fidelity rendering harness is the tailwind native parity
 * suite). Each case here red-proves a review finding on the interaction
 * state machine or the web/native alignment:
 *
 *  - press/hover state resets key on `blocked` (what actually disables the
 *    Pressable), so an explicit `disabled` prop can never strand the frame at
 *    press scale, and isDisabled + onDisabledPress never loses live hover;
 *  - isDisabled + onDisabledPress routes to onDisabledPress, never onPress;
 *  - the spinner box honors `typeOfButton` exactly like the web leg;
 *  - a concrete label color yields to custom-background contrast, exactly
 *    like the web leg;
 *  - the loading LayoutAnimation fires only on a real loading change, with
 *    `shouldAnimateBetweenLoadingStates` gating the fire and not the value.
 */
import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NATIVE_SPINNER_SIZE } from '../button-compat/compile'
import { layoutAnimationCalls } from '../button-compat/testing/native-mocks'
import { ButtonFrameContextProvider } from './context'

vi.mock('react-native', () => import('../button-compat/testing/native-mocks'))
vi.mock('react-native-gesture-handler', () => import('../button-compat/testing/gesture-handler-mock'))
vi.mock('react-native-reanimated', () => import('../button-compat/testing/reanimated-mock'))
vi.mock('react-native-svg', () => import('../button-compat/testing/react-native-svg-mock'))
vi.mock('uniwind', () => import('../button-compat/testing/uniwind-mock'))

function frameClassName(tree: ReactTestRenderer): string {
  return tree.root.findByType('RNGHPressable' as never).props['className'] as string
}

/** A responder event the press hook can persist and measure-skip (no `currentTarget`). */
function responderEvent(): Record<string, unknown> {
  return { nativeEvent: { locationX: 1, locationY: 2 }, persist: () => undefined }
}

/** The frame dispatches through the RN responder pipeline: grant is press-in, release is press-out + press. */
function hostProps(tree: ReactTestRenderer): Record<string, (event: unknown) => void> {
  return tree.root.findByType('RNGHPressable' as never).props as Record<string, (event: unknown) => void>
}

function flatStyles(tree: ReactTestRenderer, type: string): Record<string, unknown> {
  const style = tree.root.findByType(type as never).props['style'] as unknown
  const flatten = (entry: unknown): Record<string, unknown>[] =>
    Array.isArray(entry) ? entry.flatMap(flatten) : entry ? [entry as Record<string, unknown>] : []
  return Object.assign({}, ...flatten(style))
}

describe('ButtonFrameCompat (native) — interaction state resets', () => {
  it('an explicit disabled prop clears a stuck press (the Pressable stops dispatching pressOut)', async () => {
    const { ButtonFrameCompat } = await import('./ButtonFrameCompat.native')
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(<ButtonFrameCompat onPress={() => {}}>x</ButtonFrameCompat>)
    })
    act(() => {
      hostProps(tree)['onResponderGrant']?.(responderEvent())
    })
    // default/primary press scope inlined while pressed (tailwind-merge
    // collapses the bg conflict, so the -hovered cell replaces bg-neutral1).
    expect(frameClassName(tree)).toContain('bg-neutral1-hovered')

    act(() => {
      tree.update(
        <ButtonFrameCompat disabled onPress={() => {}}>
          x
        </ButtonFrameCompat>,
      )
    })
    act(() => {
      tree.update(<ButtonFrameCompat onPress={() => {}}>x</ButtonFrameCompat>)
    })
    // Pre-fix (reset keyed on isDisabled), pressed survived the disabled spell
    // and the re-enabled frame stayed painted in the press cell.
    expect(frameClassName(tree)).not.toContain('bg-neutral1-hovered')
    expect(frameClassName(tree)).toContain('bg-neutral1')
  })

  it('isDisabled + onDisabledPress (still interactive) does NOT clear live hover', async () => {
    const { ButtonFrameCompat } = await import('./ButtonFrameCompat.native')
    const props = { emphasis: 'tertiary', onDisabledPress: () => {} } as const
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(<ButtonFrameCompat {...props}>x</ButtonFrameCompat>)
    })
    act(() => {
      ;(tree.root.findByType('RNGHPressable' as never).props['onHoverIn'] as () => void)()
    })
    expect(frameClassName(tree)).toContain('border-surface3-hovered')

    // Disabled-looking but interactive: no hoverOut arrives (the pointer never
    // left), so hover must survive the spell and repaint on re-enable.
    act(() => {
      tree.update(
        <ButtonFrameCompat {...props} isDisabled>
          x
        </ButtonFrameCompat>,
      )
    })
    act(() => {
      tree.update(<ButtonFrameCompat {...props}>x</ButtonFrameCompat>)
    })
    expect(frameClassName(tree)).toContain('border-surface3-hovered')
  })
})

describe('ButtonFrameCompat (native) — caller RN handlers compose with the internal state handlers', () => {
  it("a caller's onPressIn fires AND the internal press state still paints", async () => {
    const { ButtonFrameCompat } = await import('./ButtonFrameCompat.native')
    const onPressIn = vi.fn()
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(
        <ButtonFrameCompat onPress={() => {}} onPressIn={onPressIn}>
          x
        </ButtonFrameCompat>,
      )
    })
    act(() => {
      hostProps(tree)['onResponderGrant']?.(responderEvent())
    })
    // Pre-fix, the internal handler overwrote the caller's (web composes via
    // mapRnHandlers) — the caller callback never fired.
    expect(onPressIn).toHaveBeenCalledTimes(1)
    expect(frameClassName(tree)).toContain('bg-neutral1-hovered')
  })
})

describe('ButtonFrameCompat (native) — disabled routing', () => {
  it('isDisabled + onDisabledPress routes the press to onDisabledPress, never onPress', async () => {
    const { ButtonFrameCompat } = await import('./ButtonFrameCompat.native')
    const onPress = vi.fn()
    const onDisabledPress = vi.fn()
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(
        <ButtonFrameCompat isDisabled onDisabledPress={onDisabledPress} onPress={onPress}>
          x
        </ButtonFrameCompat>,
      )
    })
    expect(hostProps(tree)['accessibilityState']).toEqual({ disabled: undefined })
    act(() => {
      hostProps(tree)['onResponderGrant']?.(responderEvent())
      hostProps(tree)['onResponderRelease']?.(responderEvent())
    })
    expect(onDisabledPress).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('isDisabled without onDisabledPress claims no touch and stays flagged disabled', async () => {
    const { ButtonFrameCompat } = await import('./ButtonFrameCompat.native')
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(
        <ButtonFrameCompat isDisabled onPress={vi.fn()}>
          x
        </ButtonFrameCompat>,
      )
    })
    expect(hostProps(tree)['accessibilityState']).toEqual({ disabled: true })
    expect(hostProps(tree)['onStartShouldSetResponder']).toBeUndefined()
    expect(hostProps(tree)['onAccessibilityAction']).toBeUndefined()
  })
})

describe('ButtonTextCompat (native) — re-broadcasts the resolved selection like web', () => {
  it('a nested ThemedIcon reads the label overrides, not the frame cell', async () => {
    const { ButtonTextCompat } = await import('./ButtonTextCompat.native')
    const { ThemedIconCompat } = await import('./ThemedIconCompat.native')
    let tree!: ReactTestRenderer
    act(() => {
      // Frame context is the default cell; the label overrides to critical.
      tree = create(
        <ButtonTextCompat variant="critical">
          <ThemedIconCompat typeOfButton="button">{createElement('glyph')}</ThemedIconCompat>
        </ButtonTextCompat>,
      )
    })
    // critical/primary text cell — pre-fix the icon fell back to the
    // default cell (text-surface1) because native never re-broadcast.
    const icon = tree.root.findByType('View' as never)
    expect(icon.props['className'] as string).toContain('text-white')
  })
})

describe('ThemedSpinnerCompat (native) — typeOfButton sizing, aligned with web', () => {
  it('icon buttons use the $icon sizes; buttons use the label line-height sizes', async () => {
    const { ThemedSpinnerCompat } = await import('./ThemedIconCompat.native')
    let iconTree!: ReactTestRenderer
    act(() => {
      iconTree = create(<ThemedSpinnerCompat typeOfButton="icon" size="medium" />)
    })
    expect(flatStyles(iconTree, 'AnimatedView')['width']).toBe(24)

    let buttonTree!: ReactTestRenderer
    act(() => {
      buttonTree = create(<ThemedSpinnerCompat typeOfButton="button" size="medium" />)
    })
    expect(flatStyles(buttonTree, 'AnimatedView')['width']).toBe(NATIVE_SPINNER_SIZE.medium)
  })
})

describe('ButtonTextCompat (native) — custom color yields to custom-background contrast, aligned with web', () => {
  it('does not paint a concrete label color while a custom background provides the contrast', async () => {
    const { ButtonTextCompat } = await import('./ButtonTextCompat.native')
    const ctx = {
      size: 'medium',
      variant: 'default',
      emphasis: 'primary',
      isDisabled: false,
      customBackgroundColor: '#123456',
      customTextClass: 'text-white',
    } as const
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(
        <ButtonFrameContextProvider value={ctx}>
          <ButtonTextCompat color="#ff0000">x</ButtonTextCompat>
        </ButtonFrameContextProvider>,
      )
    })
    expect(flatStyles(tree, 'Text')['color']).toBeUndefined()

    let bare!: ReactTestRenderer
    act(() => {
      bare = create(<ButtonTextCompat color="#ff0000">x</ButtonTextCompat>)
    })
    expect(flatStyles(bare, 'Text')['color']).toBe('#ff0000')
  })
})

describe('useLayoutAnimationOnLoadingChange (native) — configureNext is global, so it fires only on a real loading change', () => {
  /** Renders the hook alone; `enabled` is the caller's shouldAnimateBetweenLoadingStates. */
  async function probe(): Promise<(props: { loading?: boolean; enabled?: boolean }) => null> {
    const { useLayoutAnimationOnLoadingChange } = await import('./layout-animation.native')
    return function LoadingProbe({ loading, enabled = true }): null {
      useLayoutAnimationOnLoadingChange(loading, enabled)
      return null
    }
  }

  beforeEach(() => {
    layoutAnimationCalls.length = 0
  })

  it('an opt-out flip (false→true) while loading is already true does NOT fire', async () => {
    const LoadingProbe = await probe()
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(<LoadingProbe enabled={false} loading />)
    })
    expect(layoutAnimationCalls).toHaveLength(0)

    act(() => {
      tree.update(<LoadingProbe enabled loading />)
    })
    // Pre-fix (`enabled && Boolean(loading)` as the compared value), this flip
    // moved the tracked value false→true and fired a global animation even
    // though loading never changed.
    expect(layoutAnimationCalls).toHaveLength(0)
  })

  it('a genuine loading transition still fires, with the eased 300ms preset', async () => {
    const LoadingProbe = await probe()
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(<LoadingProbe loading={false} />)
    })
    expect(layoutAnimationCalls).toHaveLength(0)

    act(() => {
      tree.update(<LoadingProbe loading />)
    })
    expect(layoutAnimationCalls).toHaveLength(1)
    expect(layoutAnimationCalls[0]).toMatchObject({ duration: 300, update: { type: 'easeInEaseOut' } })

    act(() => {
      tree.update(<LoadingProbe loading={false} />)
    })
    expect(layoutAnimationCalls).toHaveLength(2)
  })

  it('the tri-state undefined→false flip is not a loading change', async () => {
    const LoadingProbe = await probe()
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(<LoadingProbe />)
    })
    act(() => {
      tree.update(<LoadingProbe loading={false} />)
    })
    expect(layoutAnimationCalls).toHaveLength(0)
  })

  it('while opted out no transition fires, and re-enabling does not replay a stale one', async () => {
    const LoadingProbe = await probe()
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(<LoadingProbe enabled={false} loading={false} />)
    })
    // A real loading change is tracked but not animated while opted out.
    act(() => {
      tree.update(<LoadingProbe enabled={false} loading />)
    })
    expect(layoutAnimationCalls).toHaveLength(0)

    // The ref kept tracking loading through the opt-out, so re-enabling at the
    // same loading value has nothing to replay.
    act(() => {
      tree.update(<LoadingProbe enabled loading />)
    })
    expect(layoutAnimationCalls).toHaveLength(0)

    // ...and the next real change animates normally.
    act(() => {
      tree.update(<LoadingProbe enabled loading={false} />)
    })
    expect(layoutAnimationCalls).toHaveLength(1)
  })
})
