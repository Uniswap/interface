import React from 'react'
import Modal, { ModalProps } from '../../../components/Modal'
import { ConfirmationPendingContent } from '../../../components/TransactionConfirmationModal'

interface BridgePendingModalProps extends ModalProps {
  text: string
}

export const BridgePendingModal = ({ isOpen, onDismiss, text }: BridgePendingModalProps) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss}>
    <ConfirmationPendingContent onDismiss={onDismiss} pendingText={text} />
  </Modal>
)
