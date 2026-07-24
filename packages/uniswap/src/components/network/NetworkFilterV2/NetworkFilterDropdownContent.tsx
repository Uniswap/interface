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
  fillAvailableHeight?: boolean
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
  fillAvailableHeight,
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

  const scrollableList = (
    <Flex
      flex={fillAvailableHeight || isMobileSheet ? 1 : undefined}
      maxHeight={!fillAvailableHeight && !isMobileSheet ? maxHeight : undefined}
      minHeight={0}
      style={{
        ...scrollbarStyles,
        scrollbarWidth: 'auto',
        overflowY: 'auto',
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
  )

  // Mobile sheet must use the flex layout too: HeightAnimator renders children absolutely at natural
  // height, so the list never gets a height bound and touch scroll does nothing inside the sheet.
  if (fillAvailableHeight || isMobileSheet) {
    return (
      <Flex flex={1} flexDirection="column" minHeight={0} overflow="hidden">
        <NetworkSearchBar autoFocus={autoFocus} value={searchQuery} onChangeText={setSearchQuery} />
        {scrollableList}
      </Flex>
    )
  }

  return (
    <>
      <NetworkSearchBar autoFocus={autoFocus} value={searchQuery} onChangeText={setSearchQuery} />
      <HeightAnimator useInitialHeight open>
        {scrollableList}
      </HeightAnimator>
    </>
  )
}
