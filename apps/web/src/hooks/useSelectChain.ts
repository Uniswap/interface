import { UniverseChainId, isSVMChain, EVMUniverseChainId } from '@universe/chains'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { promiseTimeout } from 'utilities/src/time/timing'
import { useSwitchChain as useSwitchChainWagmi } from 'wagmi'
import { UserRejectedRequestError } from '~/chains'
import { useAccount } from '~/hooks/useAccount'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

// Some injected providers (e.g. Binance in-app browser) never settle a `wallet_switchEthereumChain`
// or `wallet_addEthereumChain` request that the user dismisses natively (Android back button), which
// would otherwise leave callers awaiting this promise (e.g. transaction sagas) blocked forever.
const SWITCH_CHAIN_TIMEOUT_MS = 60 * 1000

export function useSelectChain() {
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const { switchChain } = useSwitchChainWagmi()
  const account = useAccount()

  return useEvent(async (targetChain: UniverseChainId, options?: { throwOnUserRejection?: boolean }) => {
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
      const currentChainId = account.chainId
      if (currentChainId === targetChain) {
        // some wallets (e.g. SafeWallet) only support single-chain & will throw error on `switchChain` even if already on the correct chain
        return true
      }

      const switched = await promiseTimeout(
        new Promise<boolean>((resolve, reject) => {
          switchChain(
            { chainId: targetChain as EVMUniverseChainId },
            {
              onSettled(_: unknown, error: unknown) {
                if (error) {
                  reject(error)
                } else {
                  resolve(true)
                }
              },
            },
          )
        }),
        SWITCH_CHAIN_TIMEOUT_MS,
      )

      if (switched === null) {
        throw new Error(`Timed out switching to chain ${targetChain}`)
      }

      return true
    } catch (error) {
      // Opt-in: let callers that treat a rejected switch as a user cancellation handle it themselves
      // (e.g. useSendCallback normalizes it to its local cancellation type). Default stays boolean.
      if (options?.throwOnUserRejection && error instanceof UserRejectedRequestError) {
        throw error
      }
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
  })
}
