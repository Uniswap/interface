import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { DepositSourceMenuItem } from 'src/components/earn/EarnDepositAmountControls'
import type { EarnDepositSourceSelectorModalProps } from 'src/components/earn/EarnDepositSourceSelectorModalState'
import { Flex, Text, TouchableArea } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useEvent } from 'utilities/src/react/hooks'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const SNAP_POINTS = ['60%', '100%']
const CONTENT_STYLE = { paddingBottom: spacing.spacing28 }

export function EarnDepositSourceSelectorModal({
  vaultCurrencyId,
  vaultDisplayCurrencyId,
  isOpen,
  onClose,
}: EarnDepositSourceSelectorModalProps & BaseModalProps): JSX.Element | null {
  const { t } = useTranslation()

  // Capture navigation outside the <Modal> portal — useNavigation called inside the
  // bottom-sheet portal returns a navigation prop missing methods.
  const navigation = useAppStackNavigation()

  const walletAddress = useActiveAccountAddress()
  const vaultDisplayCurrencyInfo = useCurrencyInfo(vaultDisplayCurrencyId)

  const vault = useMemo(
    () =>
      vaultCurrencyId && vaultDisplayCurrencyId
        ? { currencyId: vaultCurrencyId, displayCurrencyId: vaultDisplayCurrencyId }
        : undefined,
    [vaultCurrencyId, vaultDisplayCurrencyId],
  )

  const { depositSourceOptions } = useEarnDepositSources({
    vault,
    walletAddress: walletAddress ?? undefined,
    isOpen,
  })

  const handleSelect = useEvent((currencyId: string): void => {
    // popTo + merge so the amount sheet's existing `vault`/`position` params survive —
    // plain `navigate` replaces params rather than merging.
    navigation.popTo(ModalName.EarnDepositAmount, { initialSourceCurrencyId: currencyId }, { merge: true })
  })

  if (!vault) {
    return null
  }

  return (
    <Modal
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      overrideInnerContainer
      name={ModalName.EarnDepositSourceSelector}
      isModalOpen={isOpen}
      snapPoints={SNAP_POINTS}
      onClose={onClose}
    >
      <BottomSheetScrollView contentContainerStyle={CONTENT_STYLE} showsVerticalScrollIndicator={false}>
        <Flex gap="$spacing8" px="$spacing16" pt="$spacing8">
          <Text color="$neutral1" variant="subheading1">
            {t('token.balances.chooseNetwork')}
          </Text>

          <Flex>
            {depositSourceOptions.map((option) => (
              <TouchableArea
                key={option.id}
                hoverStyle={{ backgroundColor: '$surface2' }}
                pressStyle={{ backgroundColor: '$surface2' }}
                borderRadius="$rounded12"
                onPress={() => handleSelect(option.currencyInfo.currencyId)}
              >
                <DepositSourceMenuItem canonicalTokenName={vaultDisplayCurrencyInfo?.currency.name} option={option} />
              </TouchableArea>
            ))}
          </Flex>

          {/* TODO(CONS-2388): add "Unsupported networks" expandable section per Figma. */}
        </Flex>
      </BottomSheetScrollView>
    </Modal>
  )
}
