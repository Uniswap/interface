import React from 'react'
import Modal, { ModalProps } from '../../../components/Modal'
import { ConfirmationPendingContent } from '../../../components/TransactionConfirmationModal'

interface BridgePendingModalProps extends ModalProps {
  pendingText: string
}

export const BridgePendingModal = ({ isOpen, onDismiss, pendingText }: BridgePendingModalProps) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss}>
    <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
  </Modal>
)
