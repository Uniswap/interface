import { Keyboard } from 'react-native'
import {
  closeKeyboardBeforeCallback,
  dismissNativeKeyboard,
} from 'utilities/src/device/keyboard/dismissNativeKeyboard.native'

// Mock the react-native Keyboard module
jest.mock('react-native', () => ({
  Keyboard: {
    dismiss: jest.fn(),
    isVisible: jest.fn(),
  },
}))

describe('dismissNativeKeyboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('dismissNativeKeyboard', () => {
    it('should call Keyboard.dismiss', () => {
      dismissNativeKeyboard()
      expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('closeKeyboardBeforeCallback', () => {
    it('should call callback immediately if keyboard is not visible', () => {
      const callback = jest.fn()
      ;(Keyboard.isVisible as jest.Mock).mockReturnValue(false)

      closeKeyboardBeforeCallback(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(Keyboard.dismiss).not.toHaveBeenCalled()
    })

    // TODO(WALL-6738): add test for when keyboard is visible and callback is called after timeout
  })
})
