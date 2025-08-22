import { L2_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback } from 'react'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTimeout } from 'utilities/src/time/timing'

export function useShowPendingAfterDelay(hasPendingActivity: boolean, isOnlyUnichainPendingActivity: boolean): boolean {
  const {
    value: showUnichainTxAnyways,
    setTrue: setShowUnichainTxAnyways,
    setFalse: resetShowUnichainTxAnyways,
  } = useBooleanState(false)

  // needs to rerender once `isOnlyUnichainPendingActivity` is true so useTimeout starts
  const showUnichainTxAfterDelay = useCallback(() => {
    if (isOnlyUnichainPendingActivity && hasPendingActivity) {
      setShowUnichainTxAnyways()
      return
    }

    resetShowUnichainTxAnyways()
  }, [isOnlyUnichainPendingActivity, setShowUnichainTxAnyways, resetShowUnichainTxAnyways, hasPendingActivity])

  useTimeout(showUnichainTxAfterDelay, L2_TXN_DISMISS_MS)

  const showLoadingState = isOnlyUnichainPendingActivity
    ? hasPendingActivity && showUnichainTxAnyways
    : hasPendingActivity

  return showLoadingState
}
