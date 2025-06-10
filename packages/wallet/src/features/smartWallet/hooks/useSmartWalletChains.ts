import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'

/**
 * Hook to get all chains supported by the wallet with smart wallet features
 */
export function useSmartWalletChains(): UniverseChainId[] {
  const { chains: enabledChains } = useEnabledChains()
  const { delegationDataQuery } = useWalletDelegationContext()

  return useMemo(() => {
    const validChains: UniverseChainId[] = []

    if (!delegationDataQuery.data) {
      return []
    }

    const address = Object.keys(delegationDataQuery.data)[0]
    if (!address) {
      return []
    }
    const chainData = delegationDataQuery.data[address]
    if (!chainData) {
      return []
    }

    for (const chainId in chainData) {
      const chain = toSupportedChainId(chainId)
      if (!chain) {
        continue
      }
      const chainResult = chainData[chain]
      if (enabledChains.includes(chain) && chainResult?.latestDelegationAddress) {
        validChains.push(chain)
      }
    }

    return validChains
  }, [enabledChains, delegationDataQuery.data])
}
