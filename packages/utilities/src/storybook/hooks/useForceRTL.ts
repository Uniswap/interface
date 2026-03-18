import { useCallback, useEffect, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { I18nManager } from 'react-native'

type UseForceRTL = (startWithRTL: boolean) => { toggleRTL: () => void; isRTL: boolean }

const originalIsRTL = I18nManager.isRTL

/**
 * This hook is used to simulate RTL mode for stories.
 * It is used to toggle the RTL state and force a re-render when the RTL state changes.
 * @param startWithRTL - Whether to start with RTL.
 * @returns A function to toggle RTL mode.
 */
export const useForceRTL: UseForceRTL = (startWithRTL) => {
  const [, forceUpdate] = useState({})

  const toggleRTL = useCallback(() => {
    I18nManager.isRTL = !I18nManager.isRTL
    forceUpdate({})
  }, [])

  // Handles properly resetting the RTL state when the story is re-mounted
  useEffect(() => {
    setTimeout(() => {
      forceUpdate({})
    }, 0)
  }, [])

  useEffect(() => {
    if (startWithRTL && !I18nManager.isRTL) {
      toggleRTL()
    } else if (!startWithRTL && I18nManager.isRTL) {
      toggleRTL()
    }
  }, [startWithRTL, toggleRTL])

  useEffect(
    () => (): void => {
      I18nManager.isRTL = originalIsRTL
    },
    [],
  )

  return { toggleRTL, isRTL: I18nManager.isRTL }
}
