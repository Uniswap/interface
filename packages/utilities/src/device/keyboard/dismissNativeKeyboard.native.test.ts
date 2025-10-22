import { Keyboard } from 'react-native'
import {
  closeKeyboardBeforeCallback,
  dismissNativeKeyboard,
} from 'utilities/src/device/keyboard/dismissNativeKeyboard.native'
import { type Mock, vi } from 'vitest'

// Mock the react-native Keyboard module
vi.mock('react-native', () => ({
  Keyboard: {
    dismiss: vi.fn(),
    isVisible: vi.fn(),
  },
}))

describe('dismissNativeKeyboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('dismissNativeKeyboard', () => {
    it('should call Keyboard.dismiss', () => {
      dismissNativeKeyboard()
      expect(Keyboard.dismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('closeKeyboardBeforeCallback', () => {
    it('should call callback immediately if keyboard is not visible', () => {
      const callback = vi.fn()
      ;(Keyboard.isVisible as Mock).mockReturnValue(false)

      closeKeyboardBeforeCallback(callback)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(Keyboard.dismiss).not.toHaveBeenCalled()
    })

    // TODO(WALL-6738): add test for when keyboard is visible and callback is called after timeout
  })
})
