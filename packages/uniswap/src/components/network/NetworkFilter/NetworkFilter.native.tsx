import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { UniverseChainId } from '@universe/chains'
import { Flex, spacing } from '@universe/mycelium'
import { useState } from 'react'
import { easeInEaseOutLayoutAnimation } from 'ui/src/animations/layout/layoutAnimation'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { NetworkFilterProps } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { NetworkFilterContent } from 'uniswap/src/components/network/NetworkFilter/NetworkFilterContent'
import { NetworkFilterTrigger } from 'uniswap/src/components/network/NetworkFilter/NetworkFilterTrigger'
import { NetworkSearchBar } from 'uniswap/src/components/network/NetworkFilter/NetworkSearchBar'
import { resolveNetworkFilterDisplay } from 'uniswap/src/components/network/NetworkFilter/resolveNetworkFilterDisplay'
import { useNetworkFilterSearch } from 'uniswap/src/components/network/NetworkFilter/useNetworkFilterSearch'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useEvent } from 'utilities/src/react/hooks'

const SNAP_POINTS = ['60%', '100%']
const STICKY_HEADER_INDICES = [0]
const CONTENT_STYLE = { paddingBottom: spacing.spacing28 }

export function NetworkFilter({
  chainIds,
  selectedChain,
  onPressChain,
  includeAllNetworks,
  tieredOptions,
  allNetworksChainIds,
  forceAllNetworksLabel,
  footer,
  showSearchInput = true,
  trigger,
}: NetworkFilterProps): JSX.Element {
  const { defaultChainId } = useEnabledChains()
  const [isOpen, setIsOpen] = useState(false)
  const { showAllNetworks: includeAllNetworksRow, displayedChainId } = resolveNetworkFilterDisplay({
    chainIds,
    selectedChain,
    includeAllNetworks,
    defaultChainId,
  })
  const { searchQuery, setSearchQuery, filteredChainIds, filteredTieredOptions, showAllNetworks } =
    useNetworkFilterSearch({
      chainIds,
      includeAllNetworks: includeAllNetworksRow,
      tieredOptions,
    })

  const handleCloseSheet = useEvent((): void => {
    setSearchQuery('')
    setIsOpen(false)
  })

  const handleOpenSheet = useEvent((): void => {
    dismissNativeKeyboard()
    setSearchQuery('')
    setIsOpen(true)
  })

  const handlePressChain = useEvent((chainId: UniverseChainId | null): void => {
    handleCloseSheet()
    // Matches legacy NetworkFilter so the re-filtered list eases instead of snapping
    easeInEaseOutLayoutAnimation()
    onPressChain(chainId)
  })

  return (
    <>
      <NetworkFilterTrigger
        displayedChainId={displayedChainId}
        isOpen={isOpen}
        content={trigger?.variant === 'custom' ? trigger.content : undefined}
        onPress={handleOpenSheet}
      />
      <Modal
        extendOnKeyboardVisible
        hideKeyboardOnDismiss
        hideKeyboardOnSwipeDown
        overrideInnerContainer
        name={ModalName.NetworkSelector}
        analyticsProperties={{ isV2Modal: true }}
        isModalOpen={isOpen}
        snapPoints={SNAP_POINTS}
        onClose={handleCloseSheet}
      >
        <BottomSheetScrollView
          stickyHeaderIndices={STICKY_HEADER_INDICES}
          contentContainerStyle={CONTENT_STYLE}
          showsVerticalScrollIndicator={false}
        >
          <Flex px="$spacing8" backgroundColor="$surface1">
            {showSearchInput && <NetworkSearchBar value={searchQuery} onChangeText={setSearchQuery} />}
          </Flex>

          <Flex px="$spacing8">
            <NetworkFilterContent
              searchQuery={searchQuery}
              chainIds={filteredChainIds}
              selectedChain={selectedChain}
              showAllNetworks={showAllNetworks}
              allNetworksChainIds={allNetworksChainIds}
              forceAllNetworksLabel={forceAllNetworksLabel}
              footer={footer}
              tieredOptions={filteredTieredOptions}
              onPressChain={handlePressChain}
            />
          </Flex>
        </BottomSheetScrollView>
      </Modal>
    </>
  )
}
