import { renderHook } from '@testing-library/react'
import { DeviceEventEmitter, Dimensions, EmitterSubscription } from 'react-native'
import { act } from 'react-test-renderer'
import { useKeyboardLayout } from 'uniswap/src/utils/useKeyboardLayout'

// Mock Keyboard to use DeviceEventEmitter for event handling (react-native-web's Keyboard is a no-op)
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    Keyboard: {
      addListener: (eventName: string, callback: (event: unknown) => void): EmitterSubscription => {
        const subscription = actual.DeviceEventEmitter.addListener(eventName, callback)
        return subscription
      },
      removeAllListeners: (): void => {},
      removeListener: (): void => {},
      dismiss: (): void => {},
      isVisible: (): boolean => false,
    },
  }
})

const KEYBOARD_HEIGHT = 300
const HIDDEN_KEYBOARD_Y = Dimensions.get('window').height
const SHOWN_KEYBOARD_Y = HIDDEN_KEYBOARD_Y - KEYBOARD_HEIGHT

// Use native useKeyboardLayout implementation
vi.mock('uniswap/src/utils/useKeyboardLayout', async (importOriginal) => {
  return await vi.importActual('uniswap/src/utils/useKeyboardLayout.native.ts')
})

const showKeyboard = async (): Promise<void> => {
  await act(async () => {
    DeviceEventEmitter.emit('keyboardWillChangeFrame', {
      endCoordinates: {
        screenY: SHOWN_KEYBOARD_Y,
      },
    })
  })
}

const hideKeyboard = async (): Promise<void> => {
  await act(async () => {
    DeviceEventEmitter.emit('keyboardWillChangeFrame', {
      endCoordinates: {
        screenY: HIDDEN_KEYBOARD_Y,
      },
    })
  })
}

vi.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'iOS',
}))

describe(useKeyboardLayout, () => {
  it('returns isVisible as false if keyboard is not visible', () => {
    const { result } = renderHook(() => useKeyboardLayout())

    expect(result.current.isVisible).toBe(false)
  })

  it('returns isVisible value', async () => {
    const { result } = renderHook(() => useKeyboardLayout())

    await showKeyboard()

    expect(result.current.isVisible).toBe(true)

    await hideKeyboard()

    expect(result.current.isVisible).toBe(false)
  })

  it('returns correct containerHeight', async () => {
    const { result } = renderHook(() => useKeyboardLayout())

    await showKeyboard()

    expect(result.current.containerHeight).toBe(SHOWN_KEYBOARD_Y)

    await hideKeyboard()

    expect(result.current.containerHeight).toBe(HIDDEN_KEYBOARD_Y)
  })
})
