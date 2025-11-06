import { POPUP_MEDIUM_DISMISS_MS } from 'components/Popups/constants'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType, SwitchNetworkAction } from 'components/Popups/types'

type SwitchNetworkNotificationCallbackType = {
  chainId?: number // The chainId to show notif for, can be input or output chain
  prevChainId?: number // The previous chainId the user was swapping on, not used for bridging notifications
  outputChainId?: number // The output chainId the user is swapping to
  action: SwitchNetworkAction
}

export function showSwitchNetworkNotification({
  chainId,
  prevChainId,
  outputChainId,
  action,
}: SwitchNetworkNotificationCallbackType) {
  if (!chainId || chainId === prevChainId || chainId === outputChainId) {
    return
  }
  if (!prevChainId && !outputChainId) {
    return
  }
  const isBridgeNotification = chainId && outputChainId
  switch (action) {
    case SwitchNetworkAction.Swap:
      if (isBridgeNotification) {
        popupRegistry.addPopup(
          {
            type: PopupType.Bridge,
            inputChainId: chainId,
            outputChainId,
          },
          `bridge-${chainId}-to-${outputChainId}`,
          POPUP_MEDIUM_DISMISS_MS,
        )
        break
      } else if (prevChainId) {
        popupRegistry.addPopup(
          {
            type: PopupType.SwitchNetwork,
            chainId,
            action: SwitchNetworkAction.Swap,
          },
          `switchNetwork-${chainId}`,
          POPUP_MEDIUM_DISMISS_MS,
        )
        break
      }
      break
    default:
      popupRegistry.addPopup(
        {
          type: PopupType.SwitchNetwork,
          chainId,
          action,
        },
        `switchNetwork-${chainId}`,
        POPUP_MEDIUM_DISMISS_MS,
      )
      break
  }
}
