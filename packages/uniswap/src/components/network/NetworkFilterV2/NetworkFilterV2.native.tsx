import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useState } from 'react'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkFilterContent } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterContent'
import { NetworkFilterTrigger } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterTrigger'
import type { NetworkFilterV2Props } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2'
import { NetworkSearchBar } from 'uniswap/src/components/network/NetworkFilterV2/NetworkSearchBar'
import { useNetworkFilterSearch } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useEvent } from 'utilities/src/react/hooks'

const SNAP_POINTS = ['60%', '100%']
const STICKY_HEADER_INDICES = [0]
const CONTENT_STYLE = { paddingBottom: spacing.spacing28 }

export function NetworkFilterV2({
  chainIds,
  selectedChain,
  onPressChain,
  includeAllNetworks,
  tieredOptions,
}: NetworkFilterV2Props): JSX.Element {
  const { defaultChainId } = useEnabledChains()
  const [isOpen, setIsOpen] = useState(false)
  const { searchQuery, setSearchQuery, filteredChainIds, filteredTieredOptions, showAllNetworks } =
    useNetworkFilterSearch({
      chainIds,
      includeAllNetworks,
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
    onPressChain(chainId)
  })

  return (
    <>
      <NetworkFilterTrigger
        defaultChainId={defaultChainId}
        includeAllNetworks={includeAllNetworks}
        isOpen={isOpen}
        selectedChain={selectedChain}
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
            <NetworkSearchBar value={searchQuery} onChangeText={setSearchQuery} />
          </Flex>

          <Flex px="$spacing8">
            <NetworkFilterContent
              searchQuery={searchQuery}
              chainIds={filteredChainIds}
              selectedChain={selectedChain}
              showAllNetworks={showAllNetworks}
              tieredOptions={filteredTieredOptions}
              onPressChain={handlePressChain}
            />
          </Flex>
        </BottomSheetScrollView>
      </Modal>
    </>
  )
}
