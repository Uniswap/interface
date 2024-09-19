import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { WalletChainId } from 'uniswap/src/types/chains'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'

export function useShowSwapNetworkNotification(): (chainId?: WalletChainId, prevChainId?: WalletChainId) => void {
  const appDispatch = useDispatch()
  return useCallback(
    (chainId?: WalletChainId, prevChainId?: WalletChainId) => {
      // don't fire notification toast for first network selection
      if (!prevChainId || !chainId || prevChainId === chainId) {
        return
      }
      appDispatch(
        pushNotification({
          type: AppNotificationType.NetworkChanged,
          chainId,
          flow: 'swap',
          hideDelay: 2000,
        }),
      )
    },
    [appDispatch],
  )
}
