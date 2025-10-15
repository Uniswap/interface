import { useMemo } from 'react'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isAddress } from 'utilities/src/addresses'
import { ActiveDelegation, WalletData } from 'wallet/src/features/smartWallet/types'

export function useEnabledActiveNetworkDelegations(
  walletActiveNetworks: WalletData['activeDelegationNetworkToAddress'],
): ActiveDelegation[] {
  const getIsChainIdSupported = useIsSupportedChainIdCallback()

  return useMemo(
    (): ActiveDelegation[] =>
      Object.entries(walletActiveNetworks)
        .map(([chainId, { delegationAddress }]) => {
          if (!getIsChainIdSupported(+chainId)) {
            return null
          }

          if (!isAddress(delegationAddress)) {
            return null
          }

          return { chainId: +chainId, delegationAddress }
        })
        .filter(Boolean) as ActiveDelegation[],
    [walletActiveNetworks, getIsChainIdSupported],
  )
}
