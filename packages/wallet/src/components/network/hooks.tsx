import { useMemo } from 'react'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { ChainId } from 'uniswap/src/types/chains'
import { NetworkOption } from 'wallet/src/components/network/NetworkOption'
import { ALL_SUPPORTED_CHAIN_IDS } from 'wallet/src/constants/chains'

export function useNetworkOptions({
  onPress,
  selectedChain,
  includeAllNetworks,
}: {
  onPress: (chainId: ChainId | null) => void
  selectedChain: ChainId | null
  includeAllNetworks?: boolean
}): { key: string; onPress: () => void; render: () => JSX.Element }[] {
  return useMemo(
    () =>
      // null here is the "All networks" option
      [...(includeAllNetworks ? [null] : []), ...ALL_SUPPORTED_CHAIN_IDS].map((chainId) => ({
        key: `${ElementName.NetworkButton}-${chainId ?? 'all'}`,
        render: () => (
          <NetworkOption chainId={chainId} currentlySelected={selectedChain === chainId} />
        ),
        onPress: () => onPress(chainId),
      })),
    [includeAllNetworks, onPress, selectedChain]
  )
}
