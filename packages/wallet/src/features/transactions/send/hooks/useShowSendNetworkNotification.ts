import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { WalletChainId } from 'uniswap/src/types/chains'
import { usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'

export function useShowSendNetworkNotification({ chainId }: { chainId?: WalletChainId }): void {
  const dispatch = useDispatch()
  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!chainId || prevChainId === chainId) {
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
