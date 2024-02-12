import { default as React, useMemo } from 'react'
import { NetworkOption } from 'src/components/Network/NetworkOption'
import { ElementName } from 'src/features/telemetry/constants'
import { ALL_SUPPORTED_CHAIN_IDS, ChainId } from 'wallet/src/constants/chains'

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
