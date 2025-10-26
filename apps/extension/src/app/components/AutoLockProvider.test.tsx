import { waitFor } from '@testing-library/react'
import React from 'react'
import { AutoLockProvider } from 'src/app/components/AutoLockProvider'
import { render } from 'src/test/test-utils'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { DeviceAccessTimeout } from 'uniswap/src/features/settings/constants'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

// Mock dependencies
jest.mock('uniswap/src/extension/useIsChromeWindowFocused')
jest.mock('uniswap/src/features/telemetry/send')
jest.mock('utilities/src/logger/logger')
jest.mock('wallet/src/features/wallet/Keyring/Keyring')

// Import mocked modules with proper typing
import { useIsChromeWindowFocusedWithTimeout } from 'uniswap/src/extension/useIsChromeWindowFocused'

const mockUseIsChromeWindowFocusedWithTimeout = useIsChromeWindowFocusedWithTimeout as jest.MockedFunction<
  typeof useIsChromeWindowFocusedWithTimeout
>
const mockSendAnalyticsEvent = sendAnalyticsEvent as jest.MockedFunction<typeof sendAnalyticsEvent>
const mockLogger = logger as jest.Mocked<typeof logger>
const mockKeyring = Keyring as jest.Mocked<typeof Keyring>

// Helper functions for common test patterns
const renderAutoLockProvider = (
  deviceAccessTimeout: DeviceAccessTimeout,
  children: React.ReactNode = <div>Test</div>,
) => {
  return render(<AutoLockProvider>{children}</AutoLockProvider>, {
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
  })
}

const simulateFocusChange = (component: ReturnType<typeof render>) => (fromFocused: boolean, toFocused: boolean) => {
  mockUseIsChromeWindowFocusedWithTimeout.mockReturnValue(fromFocused)
  const { rerender } = component

  mockUseIsChromeWindowFocusedWithTimeout.mockReturnValue(toFocused)
  rerender(
    <AutoLockProvider>
      <div>Test</div>
    </AutoLockProvider>,
  )
}

const expectWalletLockCalled = async (times: number = 1) => {
  await waitFor(() => {
    expect(mockKeyring.lock).toHaveBeenCalledTimes(times)
  })
}

const expectAnalyticsEventCalled = async () => {
  await waitFor(() => {
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(ExtensionEventName.ChangeLockedState, {
      locked: true,
      location: 'background',
    })
  })
}

describe('AutoLockProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseIsChromeWindowFocusedWithTimeout.mockReturnValue(true)
    mockKeyring.lock.mockResolvedValue(true)
    mockSendAnalyticsEvent.mockImplementation(() => {})
    mockLogger.debug.mockImplementation(() => {})
    mockLogger.error.mockImplementation(() => {})
  })

  describe('window focus monitoring', () => {
    const testTimeoutValues = [
      { timeout: DeviceAccessTimeout.FiveMinutes, expectedMs: 5 * 60 * 1000, description: '5 minutes' },
      { timeout: DeviceAccessTimeout.ThirtyMinutes, expectedMs: 30 * 60 * 1000, description: '30 minutes' },
      { timeout: DeviceAccessTimeout.OneHour, expectedMs: 60 * 60 * 1000, description: '1 hour' },
      { timeout: DeviceAccessTimeout.TwentyFourHours, expectedMs: 24 * 60 * 60 * 1000, description: '24 hours' },
      {
        timeout: DeviceAccessTimeout.Never,
        expectedMs: Number.MAX_SAFE_INTEGER,
        description: 'Never (MAX_SAFE_INTEGER)',
      },
    ]

    testTimeoutValues.forEach(({ timeout, expectedMs, description }) => {
      it(`should call useIsChromeWindowFocusedWithTimeout with correct timeout for ${description}`, () => {
        renderAutoLockProvider(timeout)
        expect(mockUseIsChromeWindowFocusedWithTimeout).toHaveBeenCalledWith(expectedMs)
      })
    })
  })

  describe('wallet locking behavior', () => {
    it('should lock wallet when window loses focus and timeout is configured', async () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(mockKeyring.lock).not.toHaveBeenCalled()

      simulateFocusChange(component)(true, false)
      await expectWalletLockCalled()
    })

    it('should not lock wallet when window is focused', () => {
      mockUseIsChromeWindowFocusedWithTimeout.mockReturnValue(true)
      renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(mockKeyring.lock).not.toHaveBeenCalled()
    })

    it('should not lock wallet when timeout is set to Never', () => {
      mockUseIsChromeWindowFocusedWithTimeout.mockReturnValue(false)
      renderAutoLockProvider(DeviceAccessTimeout.Never)
      expect(mockKeyring.lock).not.toHaveBeenCalled()
    })

    it('should send analytics event when locking wallet', async () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.ThirtyMinutes)
      simulateFocusChange(component)(true, false)
      await expectAnalyticsEventCalled()
      expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should handle Keyring.lock() errors gracefully', async () => {
      const lockError = new Error('Failed to lock keyring')
      mockKeyring.lock.mockRejectedValue(lockError)

      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      simulateFocusChange(component)(true, false)

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(lockError, {
          tags: {
            file: 'AutoLockProvider.tsx',
            function: 'lockWallet',
          },
        })
      })
    })

    it('should not send analytics event when lock fails', async () => {
      const lockError = new Error('Failed to lock keyring')
      mockKeyring.lock.mockRejectedValue(lockError)

      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      simulateFocusChange(component)(true, false)

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(lockError, {
          tags: {
            file: 'AutoLockProvider.tsx',
            function: 'lockWallet',
          },
        })
      })

      expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
    })

    it('should handle undefined deviceAccessTimeout gracefully', () => {
      render(
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
              deviceAccessTimeout: undefined as any,
            },
          },
        },
      )

      expect(mockUseIsChromeWindowFocusedWithTimeout).toHaveBeenCalledWith(30 * 60 * 1000)
    })
  })

  describe('focus state changes', () => {
    it('should react to focus state changes from focused to unfocused', async () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(mockKeyring.lock).not.toHaveBeenCalled()

      simulateFocusChange(component)(true, false)
      await expectWalletLockCalled()
    })

    it('should not trigger multiple locks when already unfocused', async () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      simulateFocusChange(component)(true, false)
      await expectWalletLockCalled()

      // Rerender with same unfocused state - should not trigger additional calls
      const { rerender } = component
      rerender(
        <AutoLockProvider>
          <div>Test</div>
        </AutoLockProvider>,
      )

      expect(mockKeyring.lock).toHaveBeenCalledTimes(1)
    })

    it('should not lock again when returning to focused state', async () => {
      const component = renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)

      simulateFocusChange(component)(true, false)
      await expectWalletLockCalled()

      // Change back to focused
      simulateFocusChange(component)(false, true)
      expect(mockKeyring.lock).toHaveBeenCalledTimes(1)
    })
  })

  describe('timeout setting changes', () => {
    it('should respond to timeout setting changes', () => {
      renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(mockUseIsChromeWindowFocusedWithTimeout).toHaveBeenLastCalledWith(5 * 60 * 1000)

      renderAutoLockProvider(DeviceAccessTimeout.OneHour)
      expect(mockUseIsChromeWindowFocusedWithTimeout).toHaveBeenLastCalledWith(60 * 60 * 1000)
    })

    it('should handle timeout change from configured to Never', () => {
      mockUseIsChromeWindowFocusedWithTimeout.mockReturnValue(false)

      renderAutoLockProvider(DeviceAccessTimeout.FiveMinutes)
      expect(mockUseIsChromeWindowFocusedWithTimeout).toHaveBeenCalledWith(5 * 60 * 1000)

      renderAutoLockProvider(DeviceAccessTimeout.Never)
      expect(mockUseIsChromeWindowFocusedWithTimeout).toHaveBeenLastCalledWith(Number.MAX_SAFE_INTEGER)
    })
  })
})
