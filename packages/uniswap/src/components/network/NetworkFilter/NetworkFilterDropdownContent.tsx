import type { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { type ReactNode, useEffect } from 'react'
import { useScrollbarStyles } from 'ui/src'
import { NetworkFilterContent } from 'uniswap/src/components/network/NetworkFilter/NetworkFilterContent'
import { NetworkSearchBar } from 'uniswap/src/components/network/NetworkFilter/NetworkSearchBar'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilter/types'
import { useNetworkFilterSearch } from 'uniswap/src/components/network/NetworkFilter/useNetworkFilterSearch'

interface NetworkFilterDropdownContentProps {
  chainIds: UniverseChainId[]
  selectedChain: UniverseChainId | null
  tieredOptions?: TieredNetworkOptions
  includeAllNetworks?: boolean
  allNetworksChainIds?: UniverseChainId[]
  isOpen: boolean
  onPressChain: (chainId: UniverseChainId | null) => void
  forceAllNetworksLabel?: boolean
  showSearchInput?: boolean
  footer?: ReactNode
}

export function NetworkFilterDropdownContent({
  chainIds,
  selectedChain,
  tieredOptions,
  includeAllNetworks,
  allNetworksChainIds,
  isOpen,
  onPressChain,
  forceAllNetworksLabel,
  showSearchInput = true,
  footer,
}: NetworkFilterDropdownContentProps): JSX.Element {
  const { searchQuery, setSearchQuery, filteredChainIds, filteredTieredOptions, showAllNetworks } =
    useNetworkFilterSearch({ chainIds, tieredOptions, includeAllNetworks })

  const scrollbarStyles = useScrollbarStyles()

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen, setSearchQuery])

  return (
    <Flex flex={1} flexDirection="column" minHeight={0} overflow="hidden">
      {showSearchInput && <NetworkSearchBar value={searchQuery} onChangeText={setSearchQuery} />}
      <Flex
        flex={1}
        minHeight={0}
        style={{
          ...scrollbarStyles,
          scrollbarWidth: 'auto',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <NetworkFilterContent
          searchQuery={searchQuery}
          chainIds={filteredChainIds}
          selectedChain={selectedChain}
          showAllNetworks={showAllNetworks}
          tieredOptions={filteredTieredOptions}
          allNetworksChainIds={allNetworksChainIds}
          forceAllNetworksLabel={forceAllNetworksLabel}
          footer={footer}
          onPressChain={onPressChain}
        />
      </Flex>
    </Flex>
  )
}
