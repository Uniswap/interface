import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useMemo } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { getMobileEarnWithdrawDestinationChainIds } from 'src/components/earn/earnWithdrawDestination'
import type { EarnWithdrawNetworkSelectorModalProps } from 'src/components/earn/EarnWithdrawNetworkSelectorModalState'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { NetworkFilterContent } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterContent'
import { NetworkSearchBar } from 'uniswap/src/components/network/NetworkFilterV2/NetworkSearchBar'
import type { NetworkSelectorOption, TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { useNetworkFilterSearch } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useChainsWithUnderlyingBalance } from 'uniswap/src/features/earn/hooks/useChainsWithUnderlyingBalance'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const SNAP_POINTS = ['60%', '100%']
const STICKY_HEADER_INDICES = [0]
const CONTENT_STYLE = { paddingBottom: spacing.spacing28 }

export function EarnWithdrawNetworkSelectorModal({
  currentChainId,
  underlyingCurrencyId,
  isOpen,
  onClose,
}: EarnWithdrawNetworkSelectorModalProps & BaseModalProps): JSX.Element {
  // Capture navigation outside the <Modal> portal — useNavigation called inside the
  // bottom-sheet portal returns a navigation prop missing methods.
  const navigation = useAppStackNavigation()

  const walletAddress = useActiveAccountAddress()
  const { chainsWithBalance } = useChainsWithUnderlyingBalance({
    currencyId: underlyingCurrencyId,
    evmAddress: walletAddress ?? undefined,
  })

  const withdrawDestinationChainIds = useMemo(
    () => getMobileEarnWithdrawDestinationChainIds(underlyingCurrencyId),
    [underlyingCurrencyId],
  )

  const tieredOptions = useMemo<TieredNetworkOptions>(() => {
    const withBalances: NetworkSelectorOption[] = []
    const otherNetworks: NetworkSelectorOption[] = []
    for (const chainId of withdrawDestinationChainIds) {
      const option: NetworkSelectorOption = { chainId, label: getChainInfo(chainId).label, balanceUSD: 0 }
      if (chainsWithBalance.has(chainId)) {
        withBalances.push(option)
      } else {
        otherNetworks.push(option)
      }
    }
    return { withBalances, otherNetworks }
  }, [chainsWithBalance, withdrawDestinationChainIds])

  const { searchQuery, setSearchQuery, filteredChainIds, filteredTieredOptions } = useNetworkFilterSearch({
    chainIds: withdrawDestinationChainIds,
    tieredOptions,
  })

  const handlePressChain = useEvent((chainId: UniverseChainId | null): void => {
    if (chainId === null) {
      return
    }
    // Preserve the amount sheet's existing vault and position params.
    navigation.popTo(ModalName.EarnDepositAmount, { initialChainId: chainId }, { merge: true })
  })

  return (
    <Modal
      extendOnKeyboardVisible
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      overrideInnerContainer
      name={ModalName.EarnWithdrawNetworkSelector}
      isModalOpen={isOpen}
      snapPoints={SNAP_POINTS}
      onClose={onClose}
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
            selectedChain={currentChainId ?? null}
            showAllNetworks={false}
            tieredOptions={filteredTieredOptions}
            onPressChain={handlePressChain}
          />
        </Flex>
      </BottomSheetScrollView>
    </Modal>
  )
}
