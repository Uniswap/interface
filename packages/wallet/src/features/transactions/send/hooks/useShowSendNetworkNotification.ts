import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useShowSendNetworkNotification({ chainId }: { chainId?: UniverseChainId }): void {
  const dispatch = useDispatch()
  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!chainId || !prevChainId || prevChainId === chainId) {
      return
    }

    // We add a short delay to allow the initial modal animation to complete before showing the notification.
    setTimeout(() => {
      dispatch(
        pushNotification({
          type: AppNotificationType.NetworkChanged,
          chainId,
          flow: 'send',
        }),
      )
    }, ONE_SECOND_MS / 2)
  }, [chainId, prevChainId, dispatch])
}
