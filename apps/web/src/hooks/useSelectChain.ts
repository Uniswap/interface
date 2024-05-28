import { ChainId } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { PopupType, addPopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'

import { UserRejectedRequestError } from 'viem'
import { useSwitchChain } from './useSwitchChain'

export default function useSelectChain() {
  const dispatch = useAppDispatch()
  const switchChain = useSwitchChain()

  return useCallback(
    async (targetChain: ChainId) => {
      try {
        await switchChain(targetChain)
        return true
      } catch (error) {
        if (
          !error?.message?.includes("Request of type 'wallet_switchEthereumChain' already pending") &&
          !(error instanceof UserRejectedRequestError) /* request already pending */
        ) {
          console.error('Failed to switch networks', error)
          dispatch(
            addPopup({
              content: { failedSwitchNetwork: targetChain, type: PopupType.FailedSwitchNetwork },
              key: 'failed-network-switch',
            })
          )
        }

        return false
      }
    },
    [dispatch, switchChain]
  )
}
