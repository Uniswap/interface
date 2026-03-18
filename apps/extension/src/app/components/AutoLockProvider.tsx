import { PropsWithChildren, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useIsWalletUnlocked } from 'src/app/hooks/useIsWalletUnlocked'
import { useIsChromeWindowFocused } from 'uniswap/src/extension/useIsChromeWindowFocused'
import { selectDeviceAccessTimeoutMinutes } from 'uniswap/src/features/settings/selectors'
import { logger } from 'utilities/src/logger/logger'

export const AUTO_LOCK_ALARM_NAME = 'AutoLockAlarm'

/**
 * Helper to safely clear the auto-lock alarm with error handling
 */
function clearAutoLockAlarm(reason: string): void {
  try {
    chrome.alarms.clear(AUTO_LOCK_ALARM_NAME)
    logger.debug('AutoLockProvider', 'clearAutoLockAlarm', reason)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'AutoLockProvider', function: 'clearAutoLockAlarm' },
      extra: { reason },
    })
  }
}

/**
 * Helper to safely create the auto-lock alarm with error handling
 */
function createAutoLockAlarm(delayInMinutes: number): void {
  try {
    chrome.alarms.create(AUTO_LOCK_ALARM_NAME, { delayInMinutes })
    logger.debug('AutoLockProvider', 'createAutoLockAlarm', `Scheduled auto-lock alarm for ${delayInMinutes} minutes`)
  } catch (error) {
    logger.error(error, {
      tags: { file: 'AutoLockProvider', function: 'createAutoLockAlarm' },
      extra: { delayInMinutes },
    })
  }
}

/**
 * AutoLockProvider schedules chrome alarms to automatically lock the wallet
 * after the configured timeout period when the sidebar is not focused.
 *
 * Uses chrome.alarms API which persists even when the extension is closed,
 * ensuring reliable auto-lock behavior.
 */
export function AutoLockProvider({ children }: PropsWithChildren): JSX.Element {
  const delayInMinutes = useSelector(selectDeviceAccessTimeoutMinutes)
  const isWalletUnlocked = useIsWalletUnlocked()
  const isChromeWindowFocused = useIsChromeWindowFocused()

  // Ref to track previous focus state
  const prevFocusedRef = useRef(true)
  // Ref to track previous unlock state
  const prevUnlockedRef = useRef<boolean | null>(null)

  // On mount: Clear any existing alarm (sidebar just opened)
  useEffect(() => {
    clearAutoLockAlarm('Cleared auto-lock alarm (sidebar opened)')
  }, [])

  useEffect(() => {
    // Skip if timeout not configured (Never)
    if (delayInMinutes === undefined) {
      clearAutoLockAlarm('Cleared auto-lock alarm (timeout not configured)')
      return
    }

    const prevFocused = prevFocusedRef.current
    const prevUnlocked = prevUnlockedRef.current
    prevFocusedRef.current = isChromeWindowFocused
    prevUnlockedRef.current = isWalletUnlocked

    // Skip first render for unlock state
    if (prevUnlocked === null) {
      return
    }

    // Clear alarm when wallet state changes (locked or unlocked)
    if (prevUnlocked !== isWalletUnlocked) {
      clearAutoLockAlarm(`Cleared auto-lock alarm (wallet ${isWalletUnlocked ? 'unlocked' : 'locked'})`)
      return
    }

    // When window loses focus AND wallet is unlocked: schedule alarm
    if (prevFocused && !isChromeWindowFocused && isWalletUnlocked) {
      createAutoLockAlarm(delayInMinutes)
      return
    }

    // When window regains focus: clear alarm
    if (!prevFocused && isChromeWindowFocused) {
      clearAutoLockAlarm('Cleared auto-lock alarm (window focused)')
    }
  }, [isChromeWindowFocused, isWalletUnlocked, delayInMinutes])

  return <>{children}</>
}
