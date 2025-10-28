import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PropsWithChildren, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ExtensionState } from 'src/store/extensionReducer'
import { useIsChromeWindowFocusedWithTimeout } from 'uniswap/src/extension/useIsChromeWindowFocused'
import { deviceAccessTimeoutToMs } from 'uniswap/src/features/settings/constants'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

const AUTO_LOCK_ALARM_NAME = 'AutoLockAlarm'

/**
 * AutoLockProvider monitors window focus and automatically locks the wallet
 * after the configured inactivity timeout period.
 *
 * This component should be placed high in the component tree to ensure
 * it's always active when the extension is running.
 */
export function AutoLockProvider({ children }: PropsWithChildren): JSX.Element {
  const deviceAccessTimeout = useSelector((state: ExtensionState) => state.userSettings.deviceAccessTimeout)
  const useAlarmsApi = useFeatureFlag(FeatureFlags.UseAlarmsApi)
  const timeoutMs = deviceAccessTimeoutToMs(deviceAccessTimeout)

  // Use the window focus hook with the configured timeout
  // If timeoutMs is undefined (Never setting), use a very large number to effectively disable
  const isChromeWindowFocused = useIsChromeWindowFocusedWithTimeout(timeoutMs ?? Number.MAX_SAFE_INTEGER)

  // Maintain chrome.alarms usage behind feature flag
  useEffect(() => {
    if (useAlarmsApi) {
      chrome.alarms.create(AUTO_LOCK_ALARM_NAME, {
        delayInMinutes: 1000,
      })
    }

    return () => {
      chrome.alarms.clear(AUTO_LOCK_ALARM_NAME)
    }
  }, [useAlarmsApi])

  useEffect(() => {
    // Only lock if timeout is configured (not "Never")
    if (timeoutMs === undefined) {
      return
    }

    if (!isChromeWindowFocused) {
      const lockWallet = async (): Promise<void> => {
        try {
          logger.debug('AutoLockProvider', 'lockWallet', 'Locking wallet due to inactivity')
          await Keyring.lock()
          sendAnalyticsEvent(ExtensionEventName.ChangeLockedState, {
            locked: true,
            location: 'background',
          })
        } catch (error) {
          logger.error(error, {
            tags: {
              file: 'AutoLockProvider.tsx',
              function: 'lockWallet',
            },
          })
        }
      }

      lockWallet()
    }
  }, [isChromeWindowFocused, timeoutMs])

  return <>{children}</>
}
