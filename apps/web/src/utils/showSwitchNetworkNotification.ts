import { popupRegistry } from 'components/Popups/registry'
import { PopupType, SwitchNetworkAction } from 'components/Popups/types'

type SwitchNetworkNotificationCallbackType = {
  chainId?: number // The chainId to show notif for, can be input or output chain
  prevChainId?: number // The previous chainId the user was swapping on, not used for bridging notifications
  outputChainId?: number // The output chainId the user is swapping to
  action: SwitchNetworkAction
}

const POPUP_DURATION = 3000

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
          POPUP_DURATION,
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
          POPUP_DURATION,
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
        POPUP_DURATION,
      )
      break
  }
}
