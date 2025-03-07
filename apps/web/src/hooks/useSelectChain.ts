import { useSwitchChain } from 'hooks/useSwitchChain'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { PopupType, addPopup, removePopup } from 'state/application/reducer'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { UserRejectedRequestError } from 'viem'

export default function useSelectChain() {
  const dispatch = useDispatch()
  const switchChain = useSwitchChain()

  return useCallback(
    async (targetChain: UniverseChainId) => {
      try {
        await switchChain(targetChain)
        dispatch(
          removePopup({
            content: { failedSwitchNetwork: targetChain, type: PopupType.FailedSwitchNetwork },
            key: 'failed-network-switch',
          }),
        )
        return true
      } catch (error) {
        if (
          !error?.message?.includes("Request of type 'wallet_switchEthereumChain' already pending") &&
          !(error instanceof UserRejectedRequestError) /* request already pending */
        ) {
          logger.warn('useSelectChain', 'useSelectChain', error.message)
          dispatch(
            addPopup({
              content: { failedSwitchNetwork: targetChain, type: PopupType.FailedSwitchNetwork },
              key: 'failed-network-switch',
            }),
          )
        }
        // TODO(WEB-3306): This UX could be improved to show an error state.
        return false
      }
    },
    [dispatch, switchChain],
  )
}
