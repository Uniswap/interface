/**
 * The native Button leg's press transport: presses ride the RN responder
 * pipeline (so a Button nested in a pressable TouchableArea still gets its tap
 * on Android), TalkBack's `activate` runs the same handler, and a Button kept
 * interactive by onDisabledPress is not flagged disabled to accessibility,
 * which Android would turn into a host that swallows the press.
 */
import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-native', () => import('./testing/native-mocks'))
vi.mock('react-native-gesture-handler', () => import('./testing/gesture-handler-mock'))
vi.mock('react-native-reanimated', () => import('./testing/reanimated-mock'))
vi.mock('react-native-svg', () => import('./testing/react-native-svg-mock'))
vi.mock('uniwind', () => import('./testing/uniwind-mock'))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type HostProps = Record<string, unknown>

async function renderButton(props: Record<string, unknown>): Promise<HostProps> {
  const { ButtonCompat } = await import('./ButtonCompat.native')
  let tree!: ReactTestRenderer
  act(() => {
    tree = create(createElement(ButtonCompat, props as never, 'Max'))
  })
  return tree.root.findByType('RNGHPressable' as never).props as HostProps
}

function press(host: HostProps): void {
  const event = { nativeEvent: {}, persist: (): void => undefined }
  act(() => {
    ;(host['onResponderGrant'] as (event: unknown) => void)(event)
    ;(host['onResponderRelease'] as (event: unknown) => void)(event)
  })
}

function activate(host: HostProps): void {
  act(() => {
    ;(host['onAccessibilityAction'] as (event: unknown) => void)({ nativeEvent: { actionName: 'activate' } })
  })
}

describe('ButtonCompat (native) press transport', () => {
  it('dispatches onPress once through the responder, not the RNGH gesture prop', async () => {
    const onPress = vi.fn()
    const host = await renderButton({ onPress })

    expect(host['onPress']).toBeUndefined()
    press(host)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('runs onPress when TalkBack activates the button', async () => {
    const onPress = vi.fn()
    const host = await renderButton({ onPress })

    expect(host['accessibilityActions']).toEqual([{ name: 'activate' }])
    activate(host)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('claims no touch without a handler, so a pressable ancestor still gets it', async () => {
    const host = await renderButton({})

    expect(host['onStartShouldSetResponder']).toBeUndefined()
    expect(host['accessibilityActions']).toBeUndefined()
  })

  it('routes a disabled press to onDisabledPress and does not flag the host disabled', async () => {
    const onPress = vi.fn()
    const onDisabledPress = vi.fn()
    const host = await renderButton({ disabled: true, onPress, onDisabledPress })

    expect(host['accessibilityState']).toEqual({ disabled: undefined })
    press(host)
    activate(host)

    expect(onDisabledPress).toHaveBeenCalledTimes(2)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('stays fully disabled without onDisabledPress', async () => {
    const host = await renderButton({ disabled: true, onPress: vi.fn() })

    expect(host['accessibilityState']).toEqual({ disabled: true })
    expect(host['onStartShouldSetResponder']).toBeUndefined()
    expect(host['onAccessibilityAction']).toBeUndefined()
  })

  it('extends the tap area: hitSlop on the host (iOS hit rect) plus an invisible slop view (Android)', async () => {
    const { ButtonCompat } = await import('./ButtonCompat.native')
    let tree!: ReactTestRenderer
    act(() => {
      tree = create(createElement(ButtonCompat, { hitSlop: 16, onPress: vi.fn() } as never, 'Max'))
    })
    const host = tree.root.findByType('RNGHPressable' as never)
    const slop = host.findAll((node) => {
      const style = node.props['style'] as { position?: string } | undefined
      return typeof node.type === 'string' && style?.position === 'absolute'
    })

    expect(slop.map((node) => node.props['style'])).toEqual([
      { position: 'absolute', top: -16, left: -16, bottom: -16, right: -16 },
    ])
    expect(host.props['hitSlop']).toBe(16)
  })
})
