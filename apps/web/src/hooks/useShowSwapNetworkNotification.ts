import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { SwapTab } from 'uniswap/src/types/screens/interface'

type SwapNetworkNotificationCallbackType = {
  chainId?: number // The chainId to show notif for, can be input or output chain
  prevChainId?: number // The previous chainId the user was swapping on, not used for bridging notifications
  outputChainId?: number // The output chainId the user is swapping to
}

export function useShowSwapNetworkNotification() {
  return ({ chainId, prevChainId, outputChainId }: SwapNetworkNotificationCallbackType) => {
    if (!chainId || chainId === prevChainId || chainId === outputChainId) {
      return
    }
    const isBridgeNotification = chainId && outputChainId
    if (isBridgeNotification) {
      popupRegistry.addPopup(
        {
          type: PopupType.Bridge,
          inputChainId: chainId,
          outputChainId,
        },
        `bridge-${chainId}-to-${outputChainId}`,
        3000,
      )
    } else if (prevChainId) {
      popupRegistry.addPopup(
        {
          type: PopupType.SwitchNetwork,
          chainId,
          action: SwapTab.Swap,
        },
        `switchNetwork-${chainId}`,
        3000,
      )
    }
  }
}
