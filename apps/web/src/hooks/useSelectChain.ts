import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useCallback } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { UserRejectedRequestError } from 'viem'

export default function useSelectChain() {
  const switchChain = useSwitchChain()

  return useCallback(
    async (targetChain: UniverseChainId) => {
      try {
        await switchChain(targetChain)
        return true
      } catch (error) {
        if (
          !error?.message?.includes("Request of type 'wallet_switchEthereumChain' already pending") &&
          !(error instanceof UserRejectedRequestError) /* request already pending */
        ) {
          logger.warn('useSelectChain', 'useSelectChain', error.message)

          popupRegistry.addPopup(
            { failedSwitchNetwork: targetChain, type: PopupType.FailedSwitchNetwork },
            'failed-network-switch',
          )
        }
        // TODO(WEB-3306): This UX could be improved to show an error state.
        return false
      }
    },
    [switchChain],
  )
}
