import { useCallback } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { EarnDepositAmountContent } from 'src/components/earn/EarnDepositAmountContent'
import type { EarnDepositAmountModalState } from 'src/components/earn/EarnDepositAmountModalState'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function EarnDepositAmountModal({
  vault,
  position,
  initialAction,
  initialChainId,
  initialAmount,
  initialSourceCurrencyId,
  isOpen,
  onClose,
}: EarnDepositAmountModalState & BaseModalProps): JSX.Element | null {
  // Capture navigation outside the <Modal> portal; the bottom-sheet portal can return
  // a navigation prop without methods such as `replace`.
  const navigation = useAppStackNavigation()

  const handleReview = useCallback(
    ({
      action,
      amount,
      chainId,
      destinationCurrencyId,
      sourceCurrencyId,
    }: {
      action: EarnAction
      amount: string
      chainId: UniverseChainId
      destinationCurrencyId: string
      sourceCurrencyId?: string
    }) => {
      if (!vault) {
        return
      }

      if (action === EarnAction.Withdraw) {
        if (!position) {
          return
        }

        navigation.replace(ModalName.EarnWithdrawReview, {
          vault,
          position,
          amount,
          chainId,
          destinationCurrencyId,
        })
        return
      }

      navigation.replace(ModalName.EarnDepositReview, {
        vault,
        position,
        amount,
        sourceChainId: chainId,
        sourceCurrencyId,
      })
    },
    [navigation, vault, position],
  )

  // Open as a stacked modal (not replace) so the amount sheet stays in the stack underneath;
  // the selector pops back to it with merged `initialChainId` params.
  const handleOpenNetworkSelector = useCallback(
    (currentChainId: UniverseChainId) => {
      navigation.navigate(ModalName.EarnWithdrawNetworkSelector, {
        currentChainId,
        underlyingCurrencyId: vault?.currencyId,
      })
    },
    [navigation, vault?.currencyId],
  )

  // Stacked modal (not replace) so the amount sheet stays underneath; the selector pops
  // back to it with merged `initialSourceCurrencyId` params.
  const handleOpenDepositSourceSelector = useCallback(() => {
    if (!vault) {
      return
    }
    navigation.navigate(ModalName.EarnDepositSourceSelector, {
      vaultCurrencyId: vault.currencyId,
      vaultDisplayCurrencyId: vault.displayCurrencyId,
    })
  }, [navigation, vault])

  if (!vault) {
    return null
  }

  return (
    <Modal
      fullScreen
      hideHandlebar
      renderBehindBottomInset
      renderBehindTopInset
      name={ModalName.EarnDepositAmount}
      isModalOpen={isOpen}
      onClose={onClose}
    >
      <EarnDepositAmountContent
        vault={vault}
        position={position}
        initialAction={initialAction}
        initialChainId={initialChainId}
        initialAmount={initialAmount}
        initialSourceCurrencyId={initialSourceCurrencyId}
        onReview={handleReview}
        onOpenNetworkSelector={handleOpenNetworkSelector}
        onOpenDepositSourceSelector={handleOpenDepositSourceSelector}
      />
    </Modal>
  )
}
