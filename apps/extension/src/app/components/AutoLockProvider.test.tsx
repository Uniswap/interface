import React from 'react'
import { AutoLockProvider } from 'src/app/components/AutoLockProvider'
import { render } from 'src/test/test-utils'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { DeviceAccessTimeout } from 'uniswap/src/features/settings/constants'
import { logger } from 'utilities/src/logger/logger'

// Mock dependencies
jest.mock('uniswap/src/extension/useIsChromeWindowFocused')
jest.mock('utilities/src/logger/logger')
jest.mock('src/app/hooks/useIsWalletUnlocked', () => ({
  useIsWalletUnlocked: jest.fn(),
  isWalletUnlocked: null,
}))

// Import mocked modules
import { useIsWalletUnlocked } from 'src/app/hooks/useIsWalletUnlocked'
import { useIsChromeWindowFocused } from 'uniswap/src/extension/useIsChromeWindowFocused'

const mockUseIsChromeWindowFocused = jest.mocked(useIsChromeWindowFocused)
const mockUseIsWalletUnlocked = jest.mocked(useIsWalletUnlocked)
const mockLogger = jest.mocked(logger)

// Mock chrome.alarms API
const mockChromeAlarms = {
  create: jest.fn(),
  clear: jest.fn(),
}

global.chrome = {
  ...global.chrome,
  alarms: mockChromeAlarms as unknown as typeof chrome.alarms,
}

// Helper function
const renderAutoLockProvider = (deviceAccessTimeout: DeviceAccessTimeout) => {
  return render(
    <AutoLockProvider>
      <div>Test</div>
    </AutoLockProvider>,
    {
      preloadedState: {
        userSettings: {
          currentLanguage: Language.English,
          currentCurrency: FiatCurrency.UnitedStatesDollar,
          hideSmallBalances: true,
          hideSpamTokens: true,
          hapticsEnabled: true,
          deviceAccessTimeout,
        },
      },
    },
  )
}

const simulateFocusChange = (component: ReturnType<typeof render>) => (fromFocused: boolean, toFocused: boolean) => {
  mockUseIsChromeWindowFocused.mockReturnValue(fromFocused)
  const { rerender } = component

  mockUseIsChromeWindowFocused.mockReturnValue(toFocused)
  rerender(<AutoLockProvider />)
}

describe('AutoLockProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsChromeWindowFocused.mockReturnValue(true)
    mockUseIsWalletUnlocked.mockReturnValue(true)
    mockLogger.debug.mockImplementation(() => {})
    mockLogger.error.mockImplementation(() => {})
    mockChromeAlarms.create.mockImplementation(() => {})
    mockChromeAlarms.clear.mockImplementation(() => {})
  })

  describe('mount behavior', () => {
    it('should clear alarm on mount', () => {
      renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      expect(mockChromeAlarms.clear).toHaveBeenCalledWith('AutoLockAlarm')
    })

    it('should always render children', () => {
      const { container } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(container.textContent).toBe('Test')
    })
  })

  describe('unmount behavior', () => {
    it('should not schedule alarm on unmount (handled by background port disconnect)', () => {
      const { unmount } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      unmount()

      // Unmount no longer schedules alarm - this is handled by background script
      expect(mockChromeAlarms.create).not.toHaveBeenCalled()
    })
  })

  describe('focus change behavior (while sidebar is open)', () => {
    it('should schedule alarm when window loses focus and wallet is unlocked', () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      mockChromeAlarms.create.mockClear() // Clear the mount call

      simulateFocusChange(component)(true, false)

      expect(mockChromeAlarms.create).toHaveBeenCalledWith('AutoLockAlarm', {
        delayInMinutes: 5,
      })
    })

    it('should clear alarm when window regains focus', () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      mockChromeAlarms.clear.mockClear() // Clear the mount call

      // First lose focus (creates alarm)
      simulateFocusChange(component)(true, false)
      expect(mockChromeAlarms.create).toHaveBeenCalled()

      // Then regain focus
      simulateFocusChange(component)(false, true)

      expect(mockChromeAlarms.clear).toHaveBeenCalledWith('AutoLockAlarm')
    })

    it('should not schedule alarm when window loses focus and wallet is locked', () => {
      mockUseIsWalletUnlocked.mockReturnValue(false)
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      mockChromeAlarms.create.mockClear() // Clear the mount call

      simulateFocusChange(component)(true, false)

      expect(mockChromeAlarms.create).not.toHaveBeenCalled()
    })

    it('should not schedule alarm when window loses focus and timeout is Never', () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.Never)
      mockChromeAlarms.create.mockClear() // Clear the mount call

      simulateFocusChange(component)(true, false)

      expect(mockChromeAlarms.create).not.toHaveBeenCalled()
    })
  })

  describe('wallet state changes', () => {
    it('should clear alarm when wallet becomes locked', () => {
      mockUseIsWalletUnlocked.mockReturnValue(true)
      const { rerender } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      // Clear the initial mount call
      mockChromeAlarms.clear.mockClear()

      // Wallet becomes locked
      mockUseIsWalletUnlocked.mockReturnValue(false)
      rerender(<AutoLockProvider />)

      expect(mockChromeAlarms.clear).toHaveBeenCalledWith('AutoLockAlarm')
    })

    it('should clear alarm when wallet becomes unlocked', () => {
      mockUseIsWalletUnlocked.mockReturnValue(false)
      const { rerender } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      // Clear the initial mount call
      mockChromeAlarms.clear.mockClear()

      // Wallet becomes unlocked
      mockUseIsWalletUnlocked.mockReturnValue(true)
      rerender(<AutoLockProvider />)

      expect(mockChromeAlarms.clear).toHaveBeenCalledWith('AutoLockAlarm')
    })

    it('should not clear alarm on initial render (only mount clear)', () => {
      mockUseIsWalletUnlocked.mockReturnValue(true)
      renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      // Only the mount clear should have been called
      expect(mockChromeAlarms.clear).toHaveBeenCalledTimes(1)
    })
  })

  describe('combined scenarios', () => {
    it('should handle mount -> unmount -> remount correctly', () => {
      // First mount
      const { unmount } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(mockChromeAlarms.clear).toHaveBeenCalledTimes(1)

      // Unmount (alarm scheduling now handled in background)
      unmount()

      // Second mount (clears alarm)
      renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(mockChromeAlarms.clear).toHaveBeenCalledTimes(2)
    })

    it('should handle wallet unlock during mounted state', () => {
      mockUseIsWalletUnlocked.mockReturnValue(false)
      const { rerender } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      mockChromeAlarms.clear.mockClear()

      // Wallet unlocks while mounted
      mockUseIsWalletUnlocked.mockReturnValue(true)
      rerender(<AutoLockProvider />)

      // Should clear alarm due to wallet state change
      expect(mockChromeAlarms.clear).toHaveBeenCalled()
    })

    it('should handle wallet lock during mounted state', () => {
      mockUseIsWalletUnlocked.mockReturnValue(true)
      const { rerender } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      mockChromeAlarms.clear.mockClear()

      // Wallet locks while mounted
      mockUseIsWalletUnlocked.mockReturnValue(false)
      rerender(<AutoLockProvider />)

      // Should clear alarm due to wallet state change
      expect(mockChromeAlarms.clear).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle chrome.alarms.create errors gracefully', () => {
      const error = new Error('Permission denied')
      mockChromeAlarms.create.mockImplementationOnce(() => {
        throw error
      })

      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      mockChromeAlarms.create.mockClear()

      // This should not throw, error should be logged
      expect(() => {
        simulateFocusChange(component)(true, false)
      }).not.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'AutoLockProvider', function: 'createAutoLockAlarm' },
        extra: { delayInMinutes: 5 },
      })
    })

    it('should handle chrome.alarms.clear errors gracefully', () => {
      const error = new Error('Permission denied')
      mockChromeAlarms.clear.mockImplementationOnce(() => {
        throw error
      })

      // This should not throw, error should be logged
      expect(() => {
        renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      }).not.toThrow()

      expect(mockLogger.error).toHaveBeenCalledWith(error, {
        tags: { file: 'AutoLockProvider', function: 'clearAutoLockAlarm' },
        extra: { reason: 'Cleared auto-lock alarm (sidebar opened)' },
      })
    })

    it('should continue to function after chrome.alarms errors', () => {
      // First call fails
      mockChromeAlarms.clear.mockImplementationOnce(() => {
        throw new Error('Permission denied')
      })

      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      // Clear the error and mock calls
      mockLogger.error.mockClear()
      mockChromeAlarms.clear.mockClear()
      mockChromeAlarms.create.mockClear()

      // Subsequent calls should still work
      simulateFocusChange(component)(true, false)
      expect(mockChromeAlarms.create).toHaveBeenCalledWith('AutoLockAlarm', {
        delayInMinutes: 5,
      })
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle rapid mount/unmount cycles', () => {
      const { unmount: unmount1 } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      unmount1()

      const { unmount: unmount2 } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      unmount2()

      // Should have cleared alarm twice (once per mount)
      expect(mockChromeAlarms.clear).toHaveBeenCalledTimes(2)
      // No create calls because unmount scheduling is handled in background
      expect(mockChromeAlarms.create).not.toHaveBeenCalled()
    })

    it('should handle rapid focus changes', () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      mockChromeAlarms.create.mockClear()
      mockChromeAlarms.clear.mockClear()

      // Lose focus
      simulateFocusChange(component)(true, false)
      expect(mockChromeAlarms.create).toHaveBeenCalledTimes(1)

      // Regain focus
      simulateFocusChange(component)(false, true)
      expect(mockChromeAlarms.clear).toHaveBeenCalledTimes(1)

      // Lose focus again
      simulateFocusChange(component)(true, false)
      expect(mockChromeAlarms.create).toHaveBeenCalledTimes(2)
    })

    it('should prioritize wallet state changes over focus changes (race condition)', () => {
      mockUseIsWalletUnlocked.mockReturnValue(true)
      mockUseIsChromeWindowFocused.mockReturnValue(true)
      const { rerender } = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      mockChromeAlarms.clear.mockClear()
      mockChromeAlarms.create.mockClear()

      // Simulate simultaneous wallet lock + focus loss
      mockUseIsWalletUnlocked.mockReturnValue(false)
      mockUseIsChromeWindowFocused.mockReturnValue(false)
      rerender(<AutoLockProvider />)

      // Should only clear alarm (wallet state change priority), not schedule
      expect(mockChromeAlarms.clear).toHaveBeenCalledTimes(1)
      expect(mockChromeAlarms.create).not.toHaveBeenCalled()
    })
  })
})
