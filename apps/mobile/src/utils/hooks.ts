import { useFocusEffect } from '@react-navigation/core'
import { useCallback, useEffect } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { PollingInterval } from 'uniswap/src/constants/misc'

export function usePollOnFocusOnly({
  startPolling,
  stopPolling,
  pollingInterval,
}: {
  startPolling: (interval: PollingInterval) => void
  stopPolling: () => void
  pollingInterval: PollingInterval
}): void {
  useFocusEffect(
    useCallback(() => {
      startPolling(pollingInterval)
      return () => {
        stopPolling()
      }
    }, [startPolling, stopPolling, pollingInterval]),
  )
}

/**
 * Adds a listener to the navigation transition end event with a delayed execution.
 *
 * Sometimes, there is strange behavior when running logic in the callback passed to
 * `navigation.addListener('transitionEnd', cb)`. To mitigate this, a timeout is used
 * to delay the execution. Ensure that the function is memoized so it runs only once.
 *
 * @param {Function} fn - The callback function to be executed after the transition ends.
 * @param {number} timeoutMs - The delay in milliseconds before executing the callback.
 * @returns {void}
 */
export function useFunctionAfterNavigationTransitionEndWithDelay(fn: () => void, timeoutMs = 100): void {
  const navigation = useAppStackNavigation()

  useEffect(() => {
    let timeout: NodeJS.Timeout | number | null = null

    const unsubscribe = navigation.addListener('transitionEnd', () => {
      timeout = setTimeout(fn, timeoutMs)
    })

    return () => {
      timeout && clearTimeout(timeout)
      unsubscribe()
    }
  }, [fn, timeoutMs, navigation])
}
