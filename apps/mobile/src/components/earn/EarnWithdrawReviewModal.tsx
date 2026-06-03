import { useCallback } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { EarnWithdrawReviewModalProps } from 'src/components/earn/EarnWithdrawReviewModalState'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { EarnAction } from 'uniswap/src/features/earn/types'
import { WithdrawReviewView } from 'uniswap/src/features/earn/WithdrawReviewView'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function EarnWithdrawReviewModal({
  vault,
  position,
  amount,
  chainId,
  destinationCurrencyId,
  isOpen,
  onClose,
}: EarnWithdrawReviewModalProps & BaseModalProps): JSX.Element | null {
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
      initialAction: EarnAction.Withdraw,
      initialChainId: chainId,
      initialAmount: amount,
    })
  }, [amount, chainId, navigation, position, vault])

  if (!vault || !position || amount === undefined || chainId === undefined) {
    return null
  }

  return (
    <Modal name={ModalName.EarnWithdrawReview} isModalOpen={isOpen} onClose={onClose}>
      <Flex gap="$spacing16" px="$spacing16" pb="$spacing16">
        <WithdrawReviewView
          vault={vault}
          position={position}
          amount={amount}
          chainId={chainId}
          destinationCurrencyId={destinationCurrencyId}
          onBack={handleBack}
          onClose={onClose}
        />
      </Flex>
    </Modal>
  )
}
