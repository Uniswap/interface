import { DEFAULT_TXN_DISMISS_MS, L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback, useMemo } from 'react'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTimeout } from 'utilities/src/time/timing'

interface UseShowPendingAfterDelayParams {
  hasPendingActivity: boolean
  hasL1PendingActivity: boolean
}

export function useShowPendingAfterDelay({
  hasPendingActivity,
  hasL1PendingActivity,
}: UseShowPendingAfterDelayParams): boolean {
  const {
    value: showPendingTxAnyways,
    setTrue: setShowPendingTxAnyways,
    setFalse: resetShowPendingTxAnyways,
  } = useBooleanState(false)

  // use longer delay for L1 transactions
  const dismissDelay = useMemo(
    () => (hasL1PendingActivity ? DEFAULT_TXN_DISMISS_MS : L2_TXN_DISMISS_MS),
    [hasL1PendingActivity],
  )

  const showPendingTxAfterDelay = useCallback(() => {
    if (hasPendingActivity) {
      setShowPendingTxAnyways()
      return
    }

    resetShowPendingTxAnyways()
  }, [setShowPendingTxAnyways, resetShowPendingTxAnyways, hasPendingActivity])

  useTimeout(showPendingTxAfterDelay, dismissDelay)

  const showLoadingState = hasPendingActivity && showPendingTxAnyways

  return showLoadingState
}
