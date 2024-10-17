import { useCallback } from 'react'
import { useAddPopup, useRemovePopup } from 'state/application/hooks'
import { PopupType } from 'state/application/reducer'
import { SwapTab } from 'uniswap/src/types/screens/interface'

export function useShowSwapNetworkNotification() {
  const addPopup = useAddPopup()
  const removePopup = useRemovePopup()

  return useCallback(
    (chainId?: number, prevChainId?: number) => {
      if (!chainId || !prevChainId || chainId === prevChainId) {
        return
      }
      removePopup(`switchNetwork-${prevChainId}`)
      addPopup(
        {
          type: PopupType.SwitchNetwork,
          chainId,
          action: SwapTab.Swap,
        },
        `switchNetwork-${chainId}`,
        3000,
      )
    },
    [addPopup, removePopup],
  )
}
