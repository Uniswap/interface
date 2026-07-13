import { useEffect } from 'react'
import { Flex, HeightAnimator, useScrollbarStyles } from 'ui/src'
import { NetworkFilterContent } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterContent'
import { NetworkSearchBar } from 'uniswap/src/components/network/NetworkFilterV2/NetworkSearchBar'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { useNetworkFilterSearch } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

interface NetworkFilterDropdownContentProps {
  chainIds: UniverseChainId[]
  selectedChain: UniverseChainId | null
  tieredOptions?: TieredNetworkOptions
  includeAllNetworks?: boolean
  allNetworksChainIds?: UniverseChainId[]
  isOpen: boolean
  onPressChain: (chainId: UniverseChainId | null) => void
  maxHeight?: number
  autoFocus?: boolean
  isMobileSheet?: boolean
  forceAllNetworksLabel?: boolean
}

export function NetworkFilterDropdownContent({
  chainIds,
  selectedChain,
  tieredOptions,
  includeAllNetworks,
  allNetworksChainIds,
  isOpen,
  onPressChain,
  maxHeight,
  autoFocus,
  isMobileSheet,
  forceAllNetworksLabel,
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
    <>
      <NetworkSearchBar autoFocus={autoFocus} value={searchQuery} onChangeText={setSearchQuery} />
      <HeightAnimator useInitialHeight open>
        <Flex
          flex={isMobileSheet ? 1 : undefined}
          maxHeight={isMobileSheet ? undefined : maxHeight}
          minHeight={0}
          style={{
            ...scrollbarStyles,
            scrollbarWidth: 'auto',
            overflow: 'auto',
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
            onPressChain={onPressChain}
          />
        </Flex>
      </HeightAnimator>
    </>
  )
}
