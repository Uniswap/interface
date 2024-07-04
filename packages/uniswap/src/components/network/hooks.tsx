import { useMemo } from 'react'
import { NetworkOption } from 'uniswap/src/components/network/NetworkOption'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { UniverseChainId } from 'uniswap/src/types/chains'

export function useNetworkOptions({
  onPress,
  selectedChain,
  includeAllNetworks,
  chainIds,
}: {
  onPress: (chainId: UniverseChainId | null) => void
  selectedChain: UniverseChainId | null
  includeAllNetworks?: boolean
  chainIds: UniverseChainId[]
}): { key: string; onPress: () => void; render: () => JSX.Element }[] {
  return useMemo(
    () =>
      // null here is the "All networks" option
      [...(includeAllNetworks ? [null] : []), ...chainIds].map((chainId) => ({
        key: `${ElementName.NetworkButton}-${chainId ?? 'all'}`,
        render: () => <NetworkOption chainId={chainId} currentlySelected={selectedChain === chainId} />,
        onPress: () => onPress(chainId),
      })),
    [includeAllNetworks, onPress, selectedChain, chainIds],
  )
}
