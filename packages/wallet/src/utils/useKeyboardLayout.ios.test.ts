import { renderHook } from '@testing-library/react-hooks'
import { DeviceEventEmitter, Dimensions } from 'react-native'
import { act } from 'react-test-renderer'
import { useKeyboardLayout } from 'wallet/src/utils/useKeyboardLayout'

const KEYBOARD_HEIGHT = 300
const HIDDEN_KEYBOARD_Y = Dimensions.get('window').height
const SHOWN_KEYBOARD_Y = HIDDEN_KEYBOARD_Y - KEYBOARD_HEIGHT

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

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
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
