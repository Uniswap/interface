import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const HIDE_DELAY = ONE_SECOND_MS * 2

/**
 * Shows a network notification for a swap.
 * Depending on chain inputs passed, shows a bridging or non-bridging notification.
 */
export function useShowSwapNetworkNotification(): ({
  chainId,
  outputChainId,
}: {
  chainId: UniverseChainId
  outputChainId?: UniverseChainId
}) => void {
  const appDispatch = useDispatch()
  return useCallback(
    ({ chainId, outputChainId }: { chainId: UniverseChainId; outputChainId?: UniverseChainId }) => {
      // Output chain should only be passed when bridging
      if (outputChainId && chainId !== outputChainId) {
        appDispatch(
          pushNotification({
            type: AppNotificationType.NetworkChangedBridge,
            fromChainId: chainId,
            toChainId: outputChainId,
            hideDelay: HIDE_DELAY,
          }),
        )
      } else {
        appDispatch(
          pushNotification({
            type: AppNotificationType.NetworkChanged,
            chainId,
            flow: 'swap',
            hideDelay: HIDE_DELAY,
          }),
        )
      }
    },
    [appDispatch],
  )
}
