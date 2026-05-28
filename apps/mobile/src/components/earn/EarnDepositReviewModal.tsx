import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { DepositReviewView } from 'uniswap/src/features/earn/DepositReviewView'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnDepositReviewModalProps = {
  vault?: EarnVaultInfo
  position?: EarnPositionInfo
  amount?: string
}

export function EarnDepositReviewModal({
  vault,
  position,
  amount,
  isOpen,
  onClose,
}: EarnDepositReviewModalProps & BaseModalProps): JSX.Element | null {
  if (!vault || amount === undefined) {
    return null
  }

  return (
    <Modal name={ModalName.EarnDepositReview} isModalOpen={isOpen} onClose={onClose}>
      <Flex gap="$spacing16" px="$spacing16" pb="$spacing16">
        <DepositReviewView vault={vault} position={position} amount={amount} onBack={onClose} onClose={onClose} />
      </Flex>
    </Modal>
  )
}
