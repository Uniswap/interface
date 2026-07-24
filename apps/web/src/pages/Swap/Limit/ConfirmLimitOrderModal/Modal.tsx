import { PropsWithChildren } from 'react'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export function SwapModal({
  children,
  onDismiss,
}: PropsWithChildren<{
  onDismiss: () => void
}>) {
  return (
    <Trace modal={ModalName.ConfirmSwap}>
      <Modal name={ModalName.SwapReview} isModalOpen onClose={onDismiss} padding={0}>
        <Flex backgroundColor="$surface1" width="100%" padding="$spacing8" gap="$gap12">
          {children}
        </Flex>
      </Modal>
    </Trace>
  )
}
