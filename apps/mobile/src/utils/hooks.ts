import { useFocusEffect, useIsFocused } from '@react-navigation/core'
import { useCallback, useRef } from 'react'
import { PollingInterval } from 'wallet/src/constants/misc'

export function usePollOnFocusOnly(
  startPolling: (interval: PollingInterval) => void,
  stopPolling: () => void,
  pollingInterval: PollingInterval
): void {
  useFocusEffect(
    useCallback(() => {
      startPolling(pollingInterval)
      return () => {
        stopPolling()
      }
    }, [startPolling, stopPolling, pollingInterval])
  )
}

export function useSuspendUpdatesWhenBlured<T>(data: T): T {
  const ref = useRef<T>(data)
  if (useIsFocused()) {
    ref.current = data
  }
  return ref.current
}
