import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useAccount } from 'hooks/useAccount'
import { useCallback } from 'react'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { logger } from 'utilities/src/logger/logger'
import { UserRejectedRequestError } from 'viem'
import { useSwitchChain as useSwitchChainWagmi } from 'wagmi'

export default function useSelectChain() {
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const { switchChain } = useSwitchChainWagmi()
  const account = useAccount()

  return useCallback(
    async (targetChain: UniverseChainId) => {
      if (isSVMChain(targetChain)) {
        // Solana connections are single-chain & maintained separately from EVM connections
        return true
      }

      try {
        // Inline the useSwitchChain logic here
        const isSupportedChain = isSupportedChainCallback(targetChain as EVMUniverseChainId)
        if (!isSupportedChain) {
          throw new Error(`Chain ${targetChain} not supported for connector (${account.connector?.name})`)
        }
        if (account.chainId === targetChain) {
          // some wallets (e.g. SafeWallet) only support single-chain & will throw error on `switchChain` even if already on the correct chain
          return true
        }

        await new Promise<void>((resolve, reject) => {
          switchChain(
            { chainId: targetChain as EVMUniverseChainId },
            {
              onSettled(_: unknown, error: unknown) {
                if (error) {
                  reject(error)
                } else {
                  resolve()
                }
              },
            },
          )
        })

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
    [isSupportedChainCallback, account.chainId, account.connector?.name, switchChain],
  )
}
