import { useCallback } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { EarnDepositReviewModalProps } from 'src/components/earn/EarnDepositReviewModalState'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { DepositReviewView } from 'uniswap/src/features/earn/DepositReviewView'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function EarnDepositReviewModal({
  vault,
  position,
  amount,
  sourceCurrencyId,
  isOpen,
  onClose,
}: EarnDepositReviewModalProps & BaseModalProps): JSX.Element | null {
  // Capture navigation outside the <Modal> portal; the bottom-sheet portal can return
  // a navigation prop without methods such as `replace`.
  const navigation = useAppStackNavigation()

  const handleBack = useCallback(() => {
    if (!vault) {
      return
    }
    // `replace` (not `navigate`) — the amount sheet was popped off the stack when we entered review.
    navigation.replace(ModalName.EarnDepositAmount, {
      vault,
      position,
      initialAction: EarnAction.Deposit,
      initialAmount: amount,
      initialSourceCurrencyId: sourceCurrencyId,
    })
  }, [amount, navigation, position, sourceCurrencyId, vault])

  if (!vault || amount === undefined) {
    return null
  }

  return (
    <Modal name={ModalName.EarnDepositReview} isModalOpen={isOpen} onClose={onClose}>
      <Flex gap="$spacing16" px="$spacing16" pb="$spacing16">
        <DepositReviewView
          vault={vault}
          position={position}
          amount={amount}
          sourceCurrencyId={sourceCurrencyId ?? vault.currencyId}
          onBack={handleBack}
          onClose={onClose}
        />
      </Flex>
    </Modal>
  )
}
