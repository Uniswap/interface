import React from 'react'
import Modal, { ModalProps } from '../../../components/Modal'
import { TransactionErrorContent } from '../../../components/TransactionConfirmationModal'

interface BridgeErrorModalProps extends ModalProps {
  error: string
}

export const BridgeErrorModal = ({ isOpen, onDismiss, error }: BridgeErrorModalProps) => (
  <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90}>
    <TransactionErrorContent onDismiss={onDismiss} message={error} />
  </Modal>
)
