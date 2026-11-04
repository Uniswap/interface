/**
 * Native-leg contract: the props ./InputCompat.native.tsx hands React Native's TextInput
 * (style resolution, token colors, editable/testID mapping, web-only key stripping) and its
 * focus/blur visual-state wiring. A recording TextInput stands in for the RN host, so this
 * pins the leg's own output, not on-device rendering.
 */
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { colorsLight } from '../theme-hooks-compat/palette'
import { InputCompat as NativeLegInput } from './InputCompat.native'

type TextInputProps = Record<string, unknown> & {
  style?: Record<string, unknown>
  onFocus?: (e: unknown) => void
  onBlur?: (e: unknown) => void
}

const rendered = vi.hoisted(() => new Map<string, TextInputProps>())

// Explicit `./InputCompat.native` specifier + a mocked react-native: this vitest config
// resolves `.web.*` first and cannot parse react-native's Flow sources.
vi.mock('react-native', async () => {
  const mock = await import('./testing/react-native-mock')
  const { forwardRef } = await import('react')
  const TextInput = forwardRef<unknown, TextInputProps>((props, _ref) => {
    rendered.set(String(props['testID']), props)
    return null
  })
  return { ...mock, TextInput }
})

function propsOf(testID: string): TextInputProps {
  const props = rendered.get(testID)
  if (props === undefined) {
    throw new Error(`no TextInput rendered with testID "${testID}"`)
  }
  return props
}

describe('Input compat native leg', () => {
  it('renders the default legacy frame through the RN TextInput style prop', () => {
    render(<NativeLegInput testID="native-frame" />)
    const { style } = propsOf('native-frame')

    // size-$true cascade: fontSize 16, borderWidth 1, paddingHorizontal 8, $surface1 background.
    expect(style).toMatchObject({
      fontSize: 16,
      borderWidth: 1,
      paddingLeft: 8,
      paddingRight: 8,
      backgroundColor: colorsLight.surface1,
    })
  })

  it('resolves token-valued style props and color props before they reach TextInput', () => {
    render(
      <NativeLegInput
        backgroundColor="$surface3"
        placeholderTextColor="$neutral2"
        selectionColor="$accent1"
        testID="native-tokens"
      />,
    )
    const props = propsOf('native-tokens')

    expect(props.style?.['backgroundColor']).toBe(colorsLight.surface3)
    expect(props['placeholderTextColor']).toBe(colorsLight.neutral2)
    expect(props['selectionColor']).toBe(colorsLight.accent1)
  })

  it('maps disabled/editable to the TextInput editable contract', () => {
    render(
      <>
        <NativeLegInput disabled testID="native-disabled" />
        <NativeLegInput editable={false} testID="native-uneditable" />
        <NativeLegInput testID="native-editable" />
      </>,
    )
    expect(propsOf('native-disabled')['editable']).toBe(false)
    expect(propsOf('native-uneditable')['editable']).toBe(false)
    expect(propsOf('native-editable')['editable']).toBe(true)
  })

  it('applies focusStyle on focus and reverts on blur, chaining consumer handlers', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(
      <NativeLegInput
        focusStyle={{ backgroundColor: '$surface2' }}
        testID="native-focus"
        onBlur={onBlur}
        onFocus={onFocus}
      />,
    )

    act(() => propsOf('native-focus').onFocus?.({}))
    expect(propsOf('native-focus').style?.['backgroundColor']).toBe(colorsLight.surface2)
    expect(onFocus).toHaveBeenCalledTimes(1)

    act(() => propsOf('native-focus').onBlur?.({}))
    expect(propsOf('native-focus').style?.['backgroundColor']).toBe(colorsLight.surface1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('forwards RN-only props and strips the web-only rows prop', () => {
    const onChangeText = vi.fn()
    render(<NativeLegInput rows={4} showSoftInputOnFocus={false} testID="native-forward" onChangeText={onChangeText} />)
    const props = propsOf('native-forward')

    expect(props['onChangeText']).toBe(onChangeText)
    expect(props['showSoftInputOnFocus']).toBe(false)
    expect(props).not.toHaveProperty('rows')
  })
})
