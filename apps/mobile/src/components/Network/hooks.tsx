import { default as React, useMemo } from 'react'
import { NetworkOption } from 'src/components/Network/NetworkOption'
import { ElementName } from 'src/features/telemetry/constants'
import { ChainId } from 'wallet/src/constants/chains'
import { useActiveChainIds } from 'wallet/src/features/chains/hooks'

export function useNetworkOptions({
  onPress,
  selectedChain,
  includeAllNetworks,
}: {
  onPress: (chainId: ChainId | null) => void
  selectedChain: ChainId | null
  includeAllNetworks?: boolean
}): { key: string; onPress: () => void; render: () => JSX.Element }[] {
  const activeChains = useActiveChainIds()
  return useMemo(
    () =>
      // null here is the "All networks" option
      [...(includeAllNetworks ? [null] : []), ...activeChains].map((chainId) => ({
        key: `${ElementName.NetworkButton}-${chainId ?? 'all'}`,
        render: () => (
          <NetworkOption chainId={chainId} currentlySelected={selectedChain === chainId} />
        ),
        onPress: () => onPress(chainId),
      })),
    [activeChains, includeAllNetworks, onPress, selectedChain]
  )
}
